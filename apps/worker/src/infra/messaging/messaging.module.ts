import { Module } from '@nestjs/common'

import { DocumentStatusPublisher } from '../../domain/application/messaging/document-status-publisher.js'
import { EnvModule } from '../env/env.module.js'
import { RabbitMqConnection } from '../connections/rabbitmq.connection.js'
import { RedisConnection } from '../connections/redis.connection.js'
import { RedisDocumentStatusPublisher } from './redis-document-status-publisher.js'

@Module({
  imports: [EnvModule],
  providers: [
    RabbitMqConnection,
    RedisConnection,
    RedisDocumentStatusPublisher,
    {
      provide: DocumentStatusPublisher,
      useExisting: RedisDocumentStatusPublisher,
    },
  ],
  exports: [RabbitMqConnection, DocumentStatusPublisher],
})
export class MessagingModule {}
