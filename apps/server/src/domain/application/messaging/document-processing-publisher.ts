import type { DocumentProcessingMessage } from '@training-ia/contracts/messaging';

export abstract class DocumentProcessingPublisher {
  abstract publish(message: DocumentProcessingMessage): Promise<void>;
}
