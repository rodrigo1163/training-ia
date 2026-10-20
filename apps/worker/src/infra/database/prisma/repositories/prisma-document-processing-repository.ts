import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { Prisma } from '@training-ia/database/client'

import {
  type CompleteDocumentProcessingInput,
  DocumentProcessingRepository,
} from '../../../../domain/application/repositories/document-processing-repository.js'
import { ProcessingDocument } from '../../../../domain/enterprise/entities/processing-document.js'
import {
  isTiptapDocument,
  tiptapToPlainText,
} from '../../../../domain/enterprise/value-objects/tiptap-document.js'
import { PrismaService } from '../prisma.service.js'

@Injectable()
export class PrismaDocumentProcessingRepository
  implements DocumentProcessingRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findProcessingById(id: string): Promise<ProcessingDocument | null> {
    const document = await this.prisma.document.findFirst({
      where: { id, status: 'PROCESSING' },
      include: { content: true },
    })

    if (!document) {
      return null
    }

    const tiptapContent = document.content?.content

    if (tiptapContent !== undefined && !isTiptapDocument(tiptapContent)) {
      throw new Error(`Document ${document.id} has invalid Tiptap content`)
    }



    return new ProcessingDocument({
      id: document.id,
      botId: document.botId,
      storageKey: document.storageKey,
      contentType: document.contentType,
      content: document.content && isTiptapDocument(tiptapContent)
        ? {
          content: tiptapContent,
          text: tiptapToPlainText(tiptapContent),
          version: document.content.version,
        }
        : undefined,
    })
  }

  async complete(input: CompleteDocumentProcessingInput): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const processedAt = new Date()

      await transaction.documentContent.upsert({
        where: { documentId: input.documentId },
        create: {
          documentId: input.documentId,
          text: input.text,
          content: this.toPrismaJson(input.content),
          processedAt,
          version: input.contentVersion,
        },
        update: {
          text: input.text,
          content: this.toPrismaJson(input.content),
          processedAt,
          version: input.contentVersion,
        },
      })
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
    })
  }

  async markFailed(id: string): Promise<void> {
    await this.prisma.document.updateMany({
      where: { id, status: 'PROCESSING' },
      data: { status: 'FAILED' },
    })
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue
  }
}
