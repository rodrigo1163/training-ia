import { createHash } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { DocumentProcessingRepository } from '../repositories/document-processing-repository.js'
import { EmbeddingGenerator } from '../ai/embedding-generator.js'
import { DocumentExtractor } from '../content/document-extractor.js'
import { TextSplitter } from '../content/text-splitter.js'
import { DocumentStatusPublisher } from '../messaging/document-status-publisher.js'
import { DocumentStorage } from '../storage/document-storage.js'
import { ProcessingDocument } from '../../enterprise/entities/processing-document.js'

export interface ProcessDocumentRequest {
  documentId: string
  contentVersion: number | null
}

export type ProcessDocumentResult = 'IGNORED' | 'READY' | 'FAILED'

@Injectable()
export class ProcessDocumentUseCase {
  constructor(
    private readonly documents: DocumentProcessingRepository,
    private readonly extractor: DocumentExtractor,
    private readonly storage: DocumentStorage,
    private readonly embeddings: EmbeddingGenerator,
    private readonly splitter: TextSplitter,
    private readonly statusPublisher: DocumentStatusPublisher,
  ) { }

  async execute({ documentId, contentVersion }: ProcessDocumentRequest): Promise<ProcessDocumentResult> {
    const document = await this.documents.findProcessingById(documentId, contentVersion)

    if (!document) {
      return 'IGNORED'
    }

    try {
      const extracted = await this.getDocumentContent(document)

      const chunks = (await this.splitter.split(extracted.markdown)).filter(
        (chunk) => chunk.trim().length > 0,
      )

      if (chunks.length === 0) {
        throw new Error('Document text produced no chunks')
      }

      const vectors = await this.embeddings.embedDocuments(chunks)

      this.validateVectors(vectors, chunks.length)

      const completed = await this.documents.complete({
        documentId: document.id,
        expectedContentVersion: contentVersion,
        contentVersion: extracted.version,
        markdown: extracted.markdown,
        textHash: createHash('sha256').update(extracted.markdown).digest('hex'),
        chunks,
        vectors,
        embeddingModel: this.embeddings.model,
        embeddingDimensions: this.embeddings.dimensions,
      })

      if (!completed) {
        return 'IGNORED'
      }

      await this.statusPublisher.publish({
        documentId: document.id,
        botId: document.botId,
        status: 'READY',
      })

      return 'READY'
    } catch {
      const failed = await this.documents.markFailed(document.id, contentVersion)

      if (!failed) {
        return 'IGNORED'
      }

      await this.statusPublisher.publish({
        documentId: document.id,
        botId: document.botId,
        status: 'FAILED',
      })

      return 'FAILED'
    }
  }

  private validateVectors(vectors: number[][], chunkCount: number): void {
    if (vectors.length !== chunkCount) {
      throw new Error('Embedding count does not match chunk count')
    }

    const hasInvalidVector = vectors.some(
      (vector) =>
        vector.length !== this.embeddings.dimensions ||
        vector.some((value) => !Number.isFinite(value)),
    )

    if (hasInvalidVector) {
      throw new Error('Embedding generator returned an invalid embedding')
    }
  }
  private async getDocumentContent(document: ProcessingDocument) {
    if (document.content) {
      return {
        markdown: document.content.markdown,
        version: document.content.version,
      }
    }

    const { body } = await this.storage.download({
      key: document.storageKey,
    })

    const extracted = await this.extractor.extract({
      contentType: document.contentType,
      body,
    })

    return {
      ...extracted,
      version: 1,
    }
  }
}
