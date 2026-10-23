import {
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { DocumentStatusEventHub } from '@/domain/application/messaging/document-status-events';
import type { DocumentStatusListener } from '@/domain/application/messaging/document-status-events';
import { RedisService } from './redis.service';
import { DOCUMENT_STATUS_CHANNEL, DocumentStatusEvent, documentStatusEventSchema } from '@/domain/application/messaging/contracts/document-status';


@Injectable()
export class RedisDocumentStatusEventHub
  extends DocumentStatusEventHub
  implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisDocumentStatusEventHub.name);
  private readonly listenersByBotId = new Map<
    string,
    Set<DocumentStatusListener>
  >();

  constructor(private readonly redis: RedisService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.redis.subscriber.subscribe(DOCUMENT_STATUS_CHANNEL);
    this.redis.subscriber.on('message', this.handleMessage);
  }

  subscribe(botId: string, listener: DocumentStatusListener): () => void {
    const listeners =
      this.listenersByBotId.get(botId) ?? new Set<DocumentStatusListener>();

    listeners.add(listener);
    this.listenersByBotId.set(botId, listeners);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        this.listenersByBotId.delete(botId);
      }
    };
  }

  async onApplicationShutdown(): Promise<void> {
    this.redis.subscriber.off('message', this.handleMessage);
    this.listenersByBotId.clear();
  }

  private readonly handleMessage = (
    channel: string,
    payload: string,
  ): void => {
    if (channel !== DOCUMENT_STATUS_CHANNEL) {
      return;
    }

    const parsedEvent = documentStatusEventSchema.safeParse(
      this.parsePayload(payload),
    );

    if (!parsedEvent.success) {
      this.logger.warn('Discarding an invalid document status event');
      return;
    }

    const listeners = this.listenersByBotId.get(parsedEvent.data.botId);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(parsedEvent.data);
    }
  };

  private parsePayload(payload: string): unknown {
    try {
      return JSON.parse(payload) as DocumentStatusEvent;
    } catch {
      return null;
    }
  }
}
