import type { TiptapDocument } from '../../enterprise/value-objects/tiptap-document.js'
import type { ProcessingDocument } from '../../enterprise/entities/processing-document.js'

export interface CompleteDocumentProcessingInput {
  documentId: string
  contentVersion: number
  content: TiptapDocument
  text: string
  textHash: string
  chunks: string[]
  vectors: number[][]
  embeddingModel: string
  embeddingDimensions: number
}

export abstract class DocumentProcessingRepository {
  abstract findProcessingById(id: string): Promise<ProcessingDocument | null>

  abstract complete(input: CompleteDocumentProcessingInput): Promise<void>

  abstract markFailed(id: string): Promise<void>
}
