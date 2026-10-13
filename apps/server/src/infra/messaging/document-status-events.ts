import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common'
import { z } from 'zod'

import { RedisConnection } from '@/infra/connections/redis.connection'

export const DOCUMENT_STATUS_CHANNEL = 'document.status.updated'

const documentStatusEventSchema = z.object({
  type: z.literal('document.status.updated'),
  documentId: z.string().min(1),
  botId: z.string().min(1),
  status: z.enum(['READY', 'FAILED']),
  updatedAt: z.string().datetime(),
})

export type DocumentStatusEvent = z.infer<typeof documentStatusEventSchema>
type DocumentStatusListener = (event: DocumentStatusEvent) => void

@Injectable()
export class DocumentStatusEventHub
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(DocumentStatusEventHub.name)
  private readonly listenersByBotId = new Map<
    string,
    Set<DocumentStatusListener>
  >()

  constructor(private readonly redis: RedisConnection) {}

  async onModuleInit() {
    await this.redis.subscriber.subscribe(DOCUMENT_STATUS_CHANNEL)
    this.redis.subscriber.on('message', this.handleMessage)
  }

  subscribe(botId: string, listener: DocumentStatusListener): () => void {
    const listeners =
      this.listenersByBotId.get(botId) ?? new Set<DocumentStatusListener>()

    listeners.add(listener)
    this.listenersByBotId.set(botId, listeners)

    return () => {
      listeners.delete(listener)

      if (listeners.size === 0) {
        this.listenersByBotId.delete(botId)
      }
    }
  }

  async onApplicationShutdown() {
    this.redis.subscriber.off('message', this.handleMessage)
    this.listenersByBotId.clear()
  }

  private readonly handleMessage = (
    channel: string,
    payload: string,
  ): void => {
    if (channel !== DOCUMENT_STATUS_CHANNEL) {
      return
    }

    const parsedEvent = documentStatusEventSchema.safeParse(
      this.parsePayload(payload),
    )

    if (!parsedEvent.success) {
      this.logger.warn('Discarding an invalid document status event')
      return
    }

    const listeners = this.listenersByBotId.get(parsedEvent.data.botId)

    if (!listeners) {
      return
    }

    for (const listener of listeners) {
      listener(parsedEvent.data)
    }
  }

  private parsePayload(payload: string): unknown {
    try {
      return JSON.parse(payload)
    } catch {
      return null
    }
  }
}
