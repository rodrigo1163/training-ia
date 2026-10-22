import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@training-ia/core/events/domain-events';
import type { EventHandler } from '@training-ia/core/events/event-handler';
import { DocumentProcessingRequestedEvent } from '@/domain/enterprise/events/document-processing-requested-event';
import { DocumentProcessingPublisher } from '../messaging/document-processing-publisher.js';

@Injectable()
export class OnDocumentProcessingRequested implements EventHandler {
  constructor(
    private readonly documentProcessingPublisher: DocumentProcessingPublisher,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      DocumentProcessingRequestedEvent.name,
    );
  }

  private async handle(event: unknown): Promise<void> {
    if (!(event instanceof DocumentProcessingRequestedEvent)) {
      return;
    }

    await this.documentProcessingPublisher.publish({
      documentId: event.document.id.toString(),
      contentVersion: event.contentVersion,
    });
  }
}
