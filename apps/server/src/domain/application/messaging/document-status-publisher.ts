import type { ProcessedDocumentStatus } from '@/domain/application/messaging/contracts';

export interface PublishDocumentStatusInput {
  documentId: string;
  botId: string;
  status: ProcessedDocumentStatus;
}

export abstract class DocumentStatusPublisher {
  abstract publish(input: PublishDocumentStatusInput): Promise<void>;
}
