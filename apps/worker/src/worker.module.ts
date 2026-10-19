import { Module } from '@nestjs/common'

import { DatabaseConnection } from './infra/connections/database.connection.js'
import { RabbitMqConnection } from './infra/connections/rabbitmq.connection.js'
import { RedisConnection } from './infra/connections/redis.connection.js'
import { StorageConnection } from './infra/connections/storage.connection.js'
import { ProcessDocumentConsumer } from './jobs/process-document.consumer.js'

@Module({
  providers: [
    DatabaseConnection,
    RedisConnection,
    RabbitMqConnection,
    StorageConnection,
    ProcessDocumentConsumer,
  ],
  exports: [DatabaseConnection, RedisConnection, RabbitMqConnection, StorageConnection],
})
export class WorkerModule {}
