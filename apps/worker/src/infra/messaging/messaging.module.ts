import { Module } from '@nestjs/common'

import { DocumentStatusPublisher } from '../../domain/application/messaging/document-status-publisher.js'
import { EnvModule } from '../env/env.module.js'
import { RabbitMqService } from './rabbitmq/rabbitmq.service.js'
import { RedisService } from './redis/redis.service.js'
import { RedisDocumentStatusPublisher } from './redis/redis-document-status-publisher.js'

@Module({
  imports: [EnvModule],
  providers: [
    RabbitMqService,
    RedisService,
    RedisDocumentStatusPublisher,
    {
      provide: DocumentStatusPublisher,
      useExisting: RedisDocumentStatusPublisher,
    },
  ],
  exports: [RabbitMqService, DocumentStatusPublisher],
})
export class MessagingModule {}
