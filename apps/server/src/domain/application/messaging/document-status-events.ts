import type { DocumentStatusEvent } from '@/domain/application/messaging/contracts';

export type DocumentStatusListener = (event: DocumentStatusEvent) => void;

export abstract class DocumentStatusEventHub {
  abstract subscribe(
    botId: string,
    listener: DocumentStatusListener,
  ): () => void;
}
