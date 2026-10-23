import { DocumentProcessingMessage } from "./contracts";


export abstract class DocumentProcessingPublisher {
  abstract publish(message: DocumentProcessingMessage): Promise<void>;
}
