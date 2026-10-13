import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import amqp, { type Channel, type ChannelModel } from 'amqplib'

import { loadEnv } from '../../config/env.js'

@Injectable()
export class RabbitMqConnection implements OnModuleInit, OnApplicationShutdown {
  connection!: ChannelModel
  channel!: Channel

  async onModuleInit() {
    this.connection = await amqp.connect(loadEnv().RABBITMQ_URL)
    this.channel = await this.connection.createChannel()
  }

  async onApplicationShutdown() {
    await this.channel?.close()
    await this.connection?.close()
  }
}
