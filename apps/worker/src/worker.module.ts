import { Module } from '@nestjs/common'

import { DatabaseConnection } from './infra/connections/database.connection.js'
import { RabbitMqConnection } from './infra/connections/rabbitmq.connection.js'
import { RedisConnection } from './infra/connections/redis.connection.js'

@Module({
  providers: [DatabaseConnection, RedisConnection, RabbitMqConnection],
  exports: [DatabaseConnection, RedisConnection, RabbitMqConnection],
})
export class WorkerModule {}
