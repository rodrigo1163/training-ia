import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import amqp, { type Channel, type ChannelModel } from 'amqplib'

import { EnvService } from '../env/env.service.js'

@Injectable()
export class RabbitMqConnection implements OnModuleInit, OnApplicationShutdown {
  connection!: ChannelModel
  channel!: Channel
  private initialization?: Promise<void>

  constructor(private readonly envService: EnvService) {}

  async onModuleInit() {
    await this.connect()
  }

  async getChannel(): Promise<Channel> {
    await this.connect()

    return this.channel
  }

  private async connect(): Promise<void> {
    this.initialization ??= this.initialize()
    await this.initialization
  }

  private async initialize(): Promise<void> {
    this.connection = await amqp.connect(this.envService.get('RABBITMQ_URL'))
    this.channel = await this.connection.createChannel()
  }

  async onApplicationShutdown() {
    await this.channel?.close()
    await this.connection?.close()
  }
}
