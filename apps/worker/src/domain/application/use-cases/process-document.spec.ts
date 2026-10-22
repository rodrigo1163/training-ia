import { describe, expect, it } from 'vitest'

import type { CompleteDocumentProcessingInput } from '../repositories/document-processing-repository.js'
import { DocumentProcessingRepository } from '../repositories/document-processing-repository.js'
import {
  DocumentExtractor,
  type ExtractDocumentInput,
} from '../content/document-extractor.js'
import {
  DocumentStatusPublisher,
  type PublishDocumentStatusInput,
} from '../messaging/document-status-publisher.js'
import { DocumentStorage } from '../storage/document-storage.js'
import { EmbeddingGenerator } from '../ai/embedding-generator.js'
import { TextSplitter } from '../content/text-splitter.js'
import { ProcessingDocument } from '../../enterprise/entities/processing-document.js'
import { ProcessDocumentUseCase } from './process-document.js'

class InMemoryDocumentProcessingRepository extends DocumentProcessingRepository {
  document: ProcessingDocument | null = null
  completed?: CompleteDocumentProcessingInput
  failedDocumentIds: string[] = []
  completeResult = true
  markFailedResult = true

  async findProcessingById(): Promise<ProcessingDocument | null> {
    return this.document
  }

  async complete(input: CompleteDocumentProcessingInput): Promise<boolean> {
    this.completed = input
    return this.completeResult
  }

  async markFailed(id: string): Promise<boolean> {
    this.failedDocumentIds.push(id)
    return this.markFailedResult
  }
}

class FakeDocumentExtractor extends DocumentExtractor {
  calls: ExtractDocumentInput[] = []

  async extract(input: ExtractDocumentInput) {
    this.calls.push(input)

    return { markdown: '# Document text.' }
  }
}

class FakeDocumentStorage extends DocumentStorage {
  downloadedKeys: string[] = []

  async download({ key }: { key: string }) {
    this.downloadedKeys.push(key)

    return { body: Buffer.from('Document text.') }
  }
}

class FakeEmbeddingGenerator extends EmbeddingGenerator {
  readonly model = 'embedding-model'
  readonly dimensions = 2
  vectors = [[0.1, 0.2]]

  async embedDocuments(): Promise<number[][]> {
    return this.vectors
  }
}

class FakeTextSplitter extends TextSplitter {
  async split(text: string): Promise<string[]> {
    return [text]
  }
}

class FakeDocumentStatusPublisher extends DocumentStatusPublisher {
  published: PublishDocumentStatusInput[] = []

  async publish(input: PublishDocumentStatusInput): Promise<void> {
    this.published.push(input)
  }
}

function makeSut() {
  const documents = new InMemoryDocumentProcessingRepository()
  const extractor = new FakeDocumentExtractor()
  const storage = new FakeDocumentStorage()
  const embeddings = new FakeEmbeddingGenerator()
  const statusPublisher = new FakeDocumentStatusPublisher()
  const sut = new ProcessDocumentUseCase(
    documents,
    extractor,
    storage,
    embeddings,
    new FakeTextSplitter(),
    statusPublisher,
  )

  return { sut, documents, extractor, storage, embeddings, statusPublisher }
}

describe('Process document', () => {
  it('extracts, embeds and persists a document without stored content', async () => {
    const { sut, documents, extractor, storage, statusPublisher } = makeSut()
    documents.document = new ProcessingDocument({
      id: 'document-1',
      botId: 'bot-1',
      storageKey: 'documents/document-1.txt',
      contentType: 'text/plain',
    })

    await expect(sut.execute({ documentId: 'document-1', contentVersion: null })).resolves.toBe('READY')
    expect(storage.downloadedKeys).toEqual(['documents/document-1.txt'])
    expect(extractor.calls).toHaveLength(1)
    expect(documents.completed).toMatchObject({
      documentId: 'document-1',
      expectedContentVersion: null,
      contentVersion: 1,
      markdown: '# Document text.',
      chunks: ['# Document text.'],
      vectors: [[0.1, 0.2]],
      embeddingModel: 'embedding-model',
      embeddingDimensions: 2,
    })
    expect(statusPublisher.published).toEqual([
      { documentId: 'document-1', botId: 'bot-1', status: 'READY' },
    ])
  })

  it('reuses edited Markdown without downloading the original file', async () => {
    const { sut, documents, storage, extractor } = makeSut()
    documents.document = new ProcessingDocument({
      id: 'document-1',
      botId: 'bot-1',
      storageKey: 'documents/document-1.txt',
      contentType: 'text/plain',
      content: { markdown: '## Edited text.', version: 3 },
    })

    await sut.execute({ documentId: 'document-1', contentVersion: 3 })

    expect(storage.downloadedKeys).toEqual([])
    expect(extractor.calls).toEqual([])
    expect(documents.completed).toMatchObject({
      expectedContentVersion: 3,
      contentVersion: 3,
      markdown: '## Edited text.',
    })
  })

  it('does not publish a status when persistence detects a stale version', async () => {
    const { sut, documents, statusPublisher } = makeSut()
    documents.completeResult = false
    documents.document = new ProcessingDocument({
      id: 'document-1',
      botId: 'bot-1',
      storageKey: 'documents/document-1.txt',
      contentType: 'text/plain',
    })

    await expect(sut.execute({ documentId: 'document-1', contentVersion: null })).resolves.toBe('IGNORED')
    expect(statusPublisher.published).toEqual([])
  })

  it('marks the document as failed when embeddings are invalid', async () => {
    const { sut, documents, embeddings, statusPublisher } = makeSut()
    documents.document = new ProcessingDocument({
      id: 'document-1',
      botId: 'bot-1',
      storageKey: 'documents/document-1.txt',
      contentType: 'text/plain',
    })
    embeddings.vectors = [[0.1]]

    await expect(sut.execute({ documentId: 'document-1', contentVersion: null })).resolves.toBe('FAILED')
    expect(documents.completed).toBeUndefined()
    expect(documents.failedDocumentIds).toEqual(['document-1'])
    expect(statusPublisher.published).toEqual([
      { documentId: 'document-1', botId: 'bot-1', status: 'FAILED' },
    ])
  })
})
