import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import amqp, {
  type ChannelModel,
  type ConfirmChannel,
} from 'amqplib';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnApplicationShutdown {
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;

  constructor(private readonly envService: EnvService) {}

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(
      this.envService.get('RABBITMQ_URL'),
    );
    this.channel = await this.connection.createConfirmChannel();
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ service is not initialized');
    }

    const serializedMessage = JSON.stringify(message);

    if (serializedMessage === undefined) {
      throw new Error('RabbitMQ message could not be serialized');
    }

    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(
      queue,
      Buffer.from(serializedMessage, 'utf8'),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );

    await this.channel.waitForConfirms();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
