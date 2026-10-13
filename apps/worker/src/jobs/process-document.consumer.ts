import { randomUUID } from 'node:crypto'

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type { ConsumeMessage } from 'amqplib'
import { z } from 'zod'

import { loadEnv } from '../config/env.js'
import { DatabaseConnection } from '../infra/connections/database.connection.js'
import { RabbitMqConnection } from '../infra/connections/rabbitmq.connection.js'
import { RedisConnection } from '../infra/connections/redis.connection.js'

const DOCUMENT_PROCESSING_QUEUE = 'document.processing'
const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const EMBEDDING_BATCH_SIZE = 50
const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const DOCUMENT_STATUS_CHANNEL = 'document.status.updated'

const documentProcessingMessageSchema = z
  .object({
    documentId: z.string().min(1),
  })
  .strict()

interface DocumentContentRow {
  id: string
  botId: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
  text: string
  version: number
}

@Injectable()
export class ProcessDocumentConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProcessDocumentConsumer.name)
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  })
  private readonly embeddings: OpenAIEmbeddings

  constructor(
    private readonly database: DatabaseConnection,
    private readonly rabbitMq: RabbitMqConnection,
    private readonly redis: RedisConnection,
  ) {
    const env = loadEnv()

    this.embeddings = new OpenAIEmbeddings({
      apiKey: env.OPENROUTER_API_KEY,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      batchSize: EMBEDDING_BATCH_SIZE,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
      },
    })
  }

  async onModuleInit(): Promise<void> {
    const channel = await this.rabbitMq.getChannel()

    await channel.assertQueue(DOCUMENT_PROCESSING_QUEUE, { durable: true })
    await channel.prefetch(1)
    await channel.consume(DOCUMENT_PROCESSING_QUEUE, (message) => {
      void this.handleMessage(message)
    })
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return
    }

    try {
      const parsedJson: unknown = JSON.parse(message.content.toString('utf8'))
      const parsedMessage = documentProcessingMessageSchema.safeParse(parsedJson)

      if (!parsedMessage.success) {
        this.logger.warn('Discarding an invalid document processing message')
        return
      }

      await this.processDocument(parsedMessage.data.documentId)
    } catch {
      this.logger.error('Failed to handle a document processing message')
    } finally {
      const channel = await this.rabbitMq.getChannel()
      channel.ack(message)
    }
  }

  private async processDocument(documentId: string): Promise<void> {
    console.log(`[worker] Document processing started: ${documentId}`)

    const result = await this.database.pool.query<DocumentContentRow>(
      `SELECT d."id", d."botId", d."status", dc."text", dc."version"
       FROM "document" d
       INNER JOIN "document_content" dc ON dc."documentId" = d."id"
       WHERE d."id" = $1`,
      [documentId],
    )
    const document = result.rows[0]

    if (!document || document.status !== 'PROCESSING') {
      return
    }

    try {
      const chunks = (await this.splitter.splitText(document.text)).filter(
        (chunk) => chunk.trim().length > 0,
      )

      if (chunks.length === 0) {
        throw new Error('Document text produced no chunks')
      }

      const vectors = await this.embeddings.embedDocuments(chunks)
      this.validateVectors(vectors, chunks.length)

      await this.persistChunks(
        document.id,
        document.version,
        chunks,
        vectors,
      )
      await this.publishStatus(document, 'READY')
    } catch {
      this.logger.error(`Failed to process document ${documentId}`)

      try {
        await this.markDocumentFailed(documentId)
        await this.publishStatus(document, 'FAILED')
      } catch {
        this.logger.error(`Failed to mark document ${documentId} as failed`)
      }
    }
  }

  private validateVectors(vectors: number[][], chunkCount: number): void {
    if (vectors.length !== chunkCount) {
      throw new Error('Embedding count does not match chunk count')
    }

    const hasInvalidVector = vectors.some(
      (vector) =>
        vector.length !== EMBEDDING_DIMENSIONS ||
        vector.some((value) => !Number.isFinite(value)),
    )

    if (hasInvalidVector) {
      throw new Error('OpenRouter returned an invalid embedding')
    }
  }

  private async persistChunks(
    documentId: string,
    contentVersion: number,
    chunks: string[],
    vectors: number[][],
  ): Promise<void> {
    const client = await this.database.pool.connect()

    try {
      await client.query('BEGIN')
      await client.query(
        `DELETE FROM "document_chunk"
         WHERE "documentId" = $1 AND "contentVersion" = $2`,
        [documentId, contentVersion],
      )

      for (const [chunkIndex, text] of chunks.entries()) {
        const chunkId = randomUUID()
        const vector = vectors[chunkIndex]

        await client.query(
          `INSERT INTO "document_chunk" (
             "id", "documentId", "contentVersion", "chunkIndex", "text",
             "tokenCount", "pageStart", "pageEnd", "createdAt"
           ) VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, NOW())`,
          [chunkId, documentId, contentVersion, chunkIndex, text],
        )

        await client.query(
          `INSERT INTO "document_chunk_embedding" (
             "id", "chunkId", "model", "dimensions", "embedding", "createdAt"
           ) VALUES ($1, $2, $3, $4, $5::vector(1536), NOW())`,
          [
            randomUUID(),
            chunkId,
            EMBEDDING_MODEL,
            EMBEDDING_DIMENSIONS,
            JSON.stringify(vector),
          ],
        )
      }

      await client.query(
        `UPDATE "document"
         SET "status" = 'READY', "updatedAt" = NOW()
         WHERE "id" = $1`,
        [documentId],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async markDocumentFailed(documentId: string): Promise<void> {
    await this.database.pool.query(
      `UPDATE "document"
       SET "status" = 'FAILED', "updatedAt" = NOW()
       WHERE "id" = $1 AND "status" = 'PROCESSING'`,
      [documentId],
    )
  }

  private async publishStatus(
    document: DocumentContentRow,
    status: 'READY' | 'FAILED',
  ): Promise<void> {
    try {
      await this.redis.client.publish(
        DOCUMENT_STATUS_CHANNEL,
        JSON.stringify({
          type: 'document.status.updated',
          documentId: document.id,
          botId: document.botId,
          status,
          updatedAt: new Date().toISOString(),
        }),
      )
    } catch {
      this.logger.warn(`Failed to publish status for document ${document.id}`)
    }
  }
}
