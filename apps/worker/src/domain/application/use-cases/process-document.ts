import { createHash } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { DocumentProcessingRepository } from '../repositories/document-processing-repository.js'
import { DocumentExtractor } from '../services/document-extractor.js'
import { DocumentStatusPublisher } from '../services/document-status-publisher.js'
import { DocumentStorage } from '../services/document-storage.js'
import { EmbeddingGenerator } from '../services/embedding-generator.js'
import { TextSplitter } from '../services/text-splitter.js'
import { TiptapDocument } from '@/domain/enterprise/value-objects/tiptap-document'
import { ProcessingDocument } from '@/domain/enterprise/entities/processing-document'

export interface ProcessDocumentRequest {
  documentId: string
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

  async execute({ documentId }: ProcessDocumentRequest): Promise<ProcessDocumentResult> {
    const document = await this.documents.findProcessingById(documentId)

    if (!document) {
      return 'IGNORED'
    }

    try {
      const extracted = await this.getDocumentContent(document)

      const chunks = (await this.splitter.split(extracted.text)).filter(
        (chunk) => chunk.trim().length > 0,
      )

      if (chunks.length === 0) {
        throw new Error('Document text produced no chunks')
      }

      const vectors = await this.embeddings.embedDocuments(chunks)

      this.validateVectors(vectors, chunks.length)

      await this.documents.complete({
        documentId: document.id,
        contentVersion: extracted.version,
        content: extracted.content,
        text: extracted.text,
        textHash: createHash('sha256').update(extracted.text).digest('hex'),
        chunks,
        vectors,
        embeddingModel: this.embeddings.model,
        embeddingDimensions: this.embeddings.dimensions,
      })

      await this.statusPublisher.publish({
        documentId: document.id,
        botId: document.botId,
        status: 'READY',
      })

      return 'READY'
    } catch {
      await this.documents.markFailed(document.id)
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
        content: document.content.content,
        text: document.content.text,
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
