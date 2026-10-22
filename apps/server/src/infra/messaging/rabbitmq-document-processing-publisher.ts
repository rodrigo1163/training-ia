import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import amqp, {
  type ChannelModel,
  type ConfirmChannel,
} from 'amqplib';
import { DOCUMENT_PROCESSING_QUEUE } from '@training-ia/contracts/messaging';
import type { DocumentProcessingMessage } from '@training-ia/contracts/messaging';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class RabbitMqDocumentProcessingPublisher
  extends DocumentProcessingPublisher
  implements OnModuleInit, OnApplicationShutdown
{
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;

  constructor(private readonly envService: EnvService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(
      this.envService.get('RABBITMQ_URL'),
    );
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertQueue(DOCUMENT_PROCESSING_QUEUE, {
      durable: true,
    });
  }

  async publish(message: DocumentProcessingMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('Document processing publisher is not initialized');
    }

    this.channel.sendToQueue(
      DOCUMENT_PROCESSING_QUEUE,
      Buffer.from(JSON.stringify(message), 'utf8'),
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
