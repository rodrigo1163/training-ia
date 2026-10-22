import { Injectable } from '@nestjs/common';
import { DOCUMENT_PROCESSING_QUEUE } from '@training-ia/contracts/messaging';
import type { DocumentProcessingMessage } from '@training-ia/contracts/messaging';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { RabbitMqService } from './rabbitmq.service.js';

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
