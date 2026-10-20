import { createHash, randomUUID } from 'node:crypto'

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Prisma } from '@training-ia/database/client'
import type { ConsumeMessage } from 'amqplib'
import { z } from 'zod'

import { loadEnv } from '../config/env.js'
import { extractDocumentContent } from '../content/document-extractor.js'
import { isTiptapDocument, tiptapToPlainText, type TiptapDocument } from '../content/tiptap-content.js'
import { RabbitMqConnection } from '../infra/connections/rabbitmq.connection.js'
import { PrismaService } from '../infra/database/prisma.service.js'
import { RedisConnection } from '../infra/connections/redis.connection.js'
import { StorageConnection } from '../infra/connections/storage.connection.js'

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

type DocumentWithContent = Prisma.DocumentGetPayload<{
  include: { content: true }
}>

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
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
    private readonly prisma: PrismaService,
    private readonly rabbitMq: RabbitMqConnection,
    private readonly redis: RedisConnection,
    private readonly storage: StorageConnection,
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

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { content: true },
    })

    if (!document || document.status !== 'PROCESSING') {
      return
    }

    try {
      const extracted = await this.getDocumentContent(document)
      const chunks = (await this.splitter.splitText(extracted.text)).filter(
        (chunk) => chunk.trim().length > 0,
      )

      if (chunks.length === 0) {
        throw new Error('Document text produced no chunks')
      }

      const vectors = await this.embeddings.embedDocuments(chunks)
      this.validateVectors(vectors, chunks.length)

      await this.persistChunks(
        document.id,
        extracted.version,
        extracted.content,
        extracted.text,
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
    content: TiptapDocument,
    text: string,
    chunks: string[],
    vectors: number[][],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const processedAt = new Date()

      await transaction.documentContent.upsert({
        where: { documentId },
        create: {
          documentId,
          text,
          content: toPrismaJson(content),
          processedAt,
          version: contentVersion,
        },
        update: {
          text,
          content: toPrismaJson(content),
          processedAt,
          version: contentVersion,
        },
      })
      await transaction.documentChunk.deleteMany({
        where: { documentId, contentVersion },
      })

      for (const [chunkIndex, text] of chunks.entries()) {
        const chunkId = randomUUID()
        const vector = vectors[chunkIndex]

        await transaction.documentChunk.create({
          data: {
            id: chunkId,
            documentId,
            contentVersion,
            chunkIndex,
            text,
          },
        })

        await transaction.$executeRaw(
          Prisma.sql`INSERT INTO "document_chunk_embedding" (
            "id", "chunkId", "model", "dimensions", "embedding", "createdAt"
          ) VALUES (
            ${randomUUID()}, ${chunkId}, ${EMBEDDING_MODEL},
            ${EMBEDDING_DIMENSIONS}, ${JSON.stringify(vector)}::vector(1536), NOW()
          )`,
        )
      }

      await transaction.document.update({
        where: { id: documentId },
        data: {
          status: 'READY',
          textHash: createHash('sha256').update(text).digest('hex'),
        },
      })
    })
  }

  private async getDocumentContent(
    document: DocumentWithContent,
  ): Promise<{ content: TiptapDocument; text: string; version: number }> {
    const currentVersion = document.content?.version ?? 0

    if (document.content) {
      if (!isTiptapDocument(document.content.content)) {
        throw new Error(`Document ${document.id} has invalid Tiptap content`)
      }

      return {
        content: document.content.content,
        text: tiptapToPlainText(document.content.content),
        version: document.content.version,
      }
    }

    const extracted = await extractDocumentContent({
      contentType: document.contentType,
      body: await this.storage.download(document.storageKey),
    })

    return {
      content: extracted.content,
      text: extracted.text,
      version: currentVersion + 1,
    }
  }

  private async markDocumentFailed(documentId: string): Promise<void> {
    await this.prisma.document.updateMany({
      where: { id: documentId, status: 'PROCESSING' },
      data: { status: 'FAILED' },
    })
  }

  private async publishStatus(
    document: DocumentWithContent,
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
