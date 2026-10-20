import { Module } from '@nestjs/common'

import { DatabaseModule } from './infra/database/database.module.js'
import { RabbitMqConnection } from './infra/connections/rabbitmq.connection.js'
import { RedisConnection } from './infra/connections/redis.connection.js'
import { StorageConnection } from './infra/connections/storage.connection.js'
import { ProcessDocumentConsumer } from './jobs/process-document.consumer.js'

@Module({
  imports: [DatabaseModule],
  providers: [
    RedisConnection,
    RabbitMqConnection,
    StorageConnection,
    ProcessDocumentConsumer,
  ],
  exports: [DatabaseModule, RedisConnection, RabbitMqConnection, StorageConnection],
})
export class WorkerModule {}
