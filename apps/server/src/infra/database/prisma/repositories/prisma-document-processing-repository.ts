import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../../prisma/generated/prisma/client'

import {
  type CompleteDocumentProcessingInput,
  DocumentProcessingRepository,
} from '@/domain/application/repositories/document-processing-repository'
import { ProcessingDocument } from '@/domain/enterprise/entities/processing-document'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaDocumentProcessingRepository
  implements DocumentProcessingRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findProcessingById(
    id: string,
    expectedContentVersion: number | null,
  ): Promise<ProcessingDocument | null> {
    const document = await this.prisma.document.findFirst({
      where: { id, status: 'PROCESSING' },
      include: { content: true },
    })

    if (!document) {
      return null
    }

    const versionMatches = expectedContentVersion === null
      ? document.content === null
      : document.content?.version === expectedContentVersion

    if (!versionMatches) {
      return null
    }

    return new ProcessingDocument({
      id: document.id,
      botId: document.botId,
      storageKey: document.storageKey,
      contentType: document.contentType,
      content: document.content
        ? {
          markdown: document.content.markdown,
          version: document.content.version,
        }
        : undefined,
    })
  }

  async complete(input: CompleteDocumentProcessingInput): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const processedAt = new Date()

      const lockedDocument = await transaction.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT "id"
          FROM "document"
          WHERE "id" = ${input.documentId}
            AND "status" = 'PROCESSING'::"DocumentStatus"
          FOR UPDATE
        `,
      )

      if (lockedDocument.length === 0) {
        return false
      }

      const currentDocument = await transaction.document.findUnique({
        where: { id: input.documentId },
        include: { content: true },
      })

      if (!currentDocument || currentDocument.status !== 'PROCESSING') {
        return false
      }

      const versionMatches = input.expectedContentVersion === null
        ? currentDocument.content === null
        : currentDocument.content?.version === input.expectedContentVersion

      if (!versionMatches) {
        return false
      }

      if (input.expectedContentVersion === null) {
        await transaction.documentContent.create({
          data: {
            documentId: input.documentId,
            markdown: input.markdown,
            processedAt,
            version: input.contentVersion,
          },
        })
      } else {
        await transaction.documentContent.update({
          where: { documentId: input.documentId },
          data: { processedAt },
        })
      }
      await transaction.documentChunk.deleteMany({
        where: {
          documentId: input.documentId,
          contentVersion: input.contentVersion,
        },
      })

      for (const [chunkIndex, text] of input.chunks.entries()) {
        const chunkId = randomUUID()
        const vector = input.vectors[chunkIndex]

        await transaction.documentChunk.create({
          data: {
            id: chunkId,
            documentId: input.documentId,
            contentVersion: input.contentVersion,
            chunkIndex,
            text,
          },
        })

        await transaction.$executeRaw(
          Prisma.sql`INSERT INTO "document_chunk_embedding" (
            "id", "chunkId", "model", "dimensions", "embedding", "createdAt"
          ) VALUES (
            ${randomUUID()}, ${chunkId}, ${input.embeddingModel},
            ${input.embeddingDimensions}, ${JSON.stringify(vector)}::vector(1536), NOW()
          )`,
        )
      }

      await transaction.document.update({
        where: { id: input.documentId },
        data: {
          status: 'READY',
          textHash: input.textHash,
        },
      })
      return true
    })
  }

  async markFailed(
    id: string,
    expectedContentVersion: number | null,
  ): Promise<boolean> {
    const versionCondition = expectedContentVersion === null
      ? Prisma.sql`NOT EXISTS (
          SELECT 1
          FROM "document_content" dc
          WHERE dc."documentId" = d."id"
        )`
      : Prisma.sql`EXISTS (
          SELECT 1
          FROM "document_content" dc
          WHERE dc."documentId" = d."id"
            AND dc."version" = ${expectedContentVersion}
        )`

    const result = await this.prisma.$executeRaw<number>(Prisma.sql`
      UPDATE "document" d
      SET "status" = 'FAILED'::"DocumentStatus", "updatedAt" = NOW()
      WHERE d."id" = ${id}
        AND d."status" = 'PROCESSING'::"DocumentStatus"
        AND ${versionCondition}
    `)

    return result > 0
  }
}
