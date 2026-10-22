import type { DocumentStatusEvent } from '@training-ia/contracts/messaging';

export type DocumentStatusListener = (event: DocumentStatusEvent) => void;

export abstract class DocumentStatusEventHub {
  abstract subscribe(
    botId: string,
    listener: DocumentStatusListener,
  ): () => void;
}
