import { Module } from '@nestjs/common';
import { DocumentStatusEventHub } from '@/domain/application/messaging/document-status-events';
import { DocumentStatusPublisher } from '@/domain/application/messaging/document-status-publisher';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { EnvModule } from '@/infra/env/env.module';
import { RabbitMqService } from './rabbitmq/rabbitmq.service.js';
import { RabbitMqDocumentProcessingPublisher } from './rabbitmq/rabbitmq-document-processing-publisher.js';
import { RedisService } from './redis/redis.service.js';
import { RedisDocumentStatusEventHub } from './redis/redis-document-status-event-hub.js';
import { RedisDocumentStatusPublisher } from './redis/redis-document-status-publisher.js';

@Module({
  imports: [EnvModule],
  providers: [
    RedisService,
    RedisDocumentStatusEventHub,
    RedisDocumentStatusPublisher,
    RabbitMqService,
    RabbitMqDocumentProcessingPublisher,
    {
      provide: DocumentStatusEventHub,
      useExisting: RedisDocumentStatusEventHub,
    },
    {
      provide: DocumentStatusPublisher,
      useExisting: RedisDocumentStatusPublisher,
    },
    {
      provide: DocumentProcessingPublisher,
      useExisting: RabbitMqDocumentProcessingPublisher,
    },
  ],
  exports: [
    DocumentStatusEventHub,
    DocumentStatusPublisher,
    DocumentProcessingPublisher,
    RabbitMqService,
  ],
})
export class MessagingModule { }
