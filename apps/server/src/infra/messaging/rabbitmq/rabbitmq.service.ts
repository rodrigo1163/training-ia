import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import amqp, {
  type Channel,
  type ChannelModel,
  type ConfirmChannel,
} from 'amqplib';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnApplicationShutdown {
  private connection?: ChannelModel;
  private publishChannel?: ConfirmChannel;
  private consumerChannel?: Channel;
  private initialization?: Promise<void>;

  constructor(private readonly envService: EnvService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    await this.connect();

    if (!this.publishChannel) {
      throw new Error('RabbitMQ service is not initialized');
    }

    const serializedMessage = JSON.stringify(message);

    if (serializedMessage === undefined) {
      throw new Error('RabbitMQ message could not be serialized');
    }

    await this.publishChannel.assertQueue(queue, { durable: true });
    this.publishChannel.sendToQueue(
      queue,
      Buffer.from(serializedMessage, 'utf8'),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );

    await this.publishChannel.waitForConfirms();
  }

  async getConsumerChannel(): Promise<Channel> {
    await this.connect();

    if (!this.consumerChannel) {
      throw new Error('RabbitMQ consumer channel is not initialized');
    }

    return this.consumerChannel;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumerChannel?.close();
    await this.publishChannel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<void> {
    this.initialization ??= this.initialize();
    await this.initialization;
  }

  private async initialize(): Promise<void> {
    this.connection = await amqp.connect(this.envService.get('RABBITMQ_URL'));
    this.publishChannel = await this.connection.createConfirmChannel();
    this.consumerChannel = await this.connection.createChannel();
  }
}
