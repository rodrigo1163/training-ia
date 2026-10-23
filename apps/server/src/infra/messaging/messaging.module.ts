import { Module } from '@nestjs/common';
import { DocumentStatusEventHub } from '@/domain/application/messaging/document-status-events';
import { DocumentStatusPublisher } from '@/domain/application/messaging/document-status-publisher';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { EnvModule } from '@/infra/env/env.module';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';
import { RabbitMqDocumentProcessingPublisher } from './rabbitmq/rabbitmq-document-processing-publisher';
import { RedisService } from './redis/redis.service';
import { RedisDocumentStatusEventHub } from './redis/redis-document-status-event-hub';
import { RedisDocumentStatusPublisher } from './redis/redis-document-status-publisher';

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
