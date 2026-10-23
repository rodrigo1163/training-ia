import { Injectable } from '@nestjs/common';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { RabbitMqService } from './rabbitmq.service';
import { DOCUMENT_PROCESSING_QUEUE, DocumentProcessingMessage } from '@/domain/application/messaging/contracts/document-processing';

@Injectable()
export class RabbitMqDocumentProcessingPublisher extends DocumentProcessingPublisher {
  constructor(private readonly rabbitMq: RabbitMqService) {
    super();
  }

  async publish(message: DocumentProcessingMessage): Promise<void> {
    await this.rabbitMq.publish(
      DOCUMENT_PROCESSING_QUEUE,
      message,
    );
  }
}
