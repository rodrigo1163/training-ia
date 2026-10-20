import { Injectable, Logger } from '@nestjs/common'
import {
  DOCUMENT_STATUS_CHANNEL,
  type DocumentStatusEvent,
} from '@training-ia/contracts/messaging'

import {
  DocumentStatusPublisher,
  type PublishDocumentStatusInput,
} from '../../domain/application/services/document-status-publisher.js'
import { RedisConnection } from '../connections/redis.connection.js'

@Injectable()
export class RedisDocumentStatusPublisher implements DocumentStatusPublisher {
  private readonly logger = new Logger(RedisDocumentStatusPublisher.name)

  constructor(private readonly redis: RedisConnection) {}

  async publish(input: PublishDocumentStatusInput): Promise<void> {
    const event: DocumentStatusEvent = {
      type: 'document.status.updated',
      ...input,
      updatedAt: new Date().toISOString(),
    }

    try {
      await this.redis.client.publish(
        DOCUMENT_STATUS_CHANNEL,
        JSON.stringify(event),
      )
    } catch {
      this.logger.warn(`Failed to publish status for document ${input.documentId}`)
    }
  }
}
