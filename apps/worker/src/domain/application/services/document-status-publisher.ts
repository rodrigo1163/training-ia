import type { ProcessedDocumentStatus } from '@training-ia/contracts/messaging'

export interface PublishDocumentStatusInput {
  documentId: string
  botId: string
  status: ProcessedDocumentStatus
}

export abstract class DocumentStatusPublisher {
  abstract publish(input: PublishDocumentStatusInput): Promise<void>
}
