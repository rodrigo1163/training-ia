import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'

import type { ConsumeMessage } from 'amqplib'

import { ProcessDocumentUseCase } from '@/domain/application/use-cases/process-document'
import { RabbitMqService } from './rabbitmq.service'
import { DOCUMENT_PROCESSING_QUEUE, documentProcessingMessageSchema } from '@/domain/application/messaging/contracts/document-processing'

@Injectable()
export class ProcessDocumentConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProcessDocumentConsumer.name)

  constructor(
    private readonly rabbitMq: RabbitMqService,
    private readonly processDocument: ProcessDocumentUseCase,
  ) { }

  async onModuleInit(): Promise<void> {
    const channel = await this.rabbitMq.getConsumerChannel()

    await channel.assertQueue(DOCUMENT_PROCESSING_QUEUE, { durable: true })
    await channel.prefetch(1)
    await channel.consume(DOCUMENT_PROCESSING_QUEUE, (message) => {
      void this.handleMessage(message)
    })
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return
    }

    try {
      const parsedMessage = documentProcessingMessageSchema.safeParse(
        this.parsePayload(message),
      )

      if (!parsedMessage.success) {
        this.logger.warn('Discarding an invalid document processing message')
        return
      }

      await this.processDocument.execute(parsedMessage.data)
    } catch {
      this.logger.error('Failed to handle a document processing message')
    } finally {
      const channel = await this.rabbitMq.getConsumerChannel()
      channel.ack(message)
    }
  }

  private parsePayload(message: ConsumeMessage): unknown {
    try {
      return JSON.parse(message.content.toString('utf8'))
    } catch {
      return null
    }
  }
}
