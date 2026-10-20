import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type { DomainEvent } from '@training-ia/core/events/domain-event';
import type { Document } from '../entities/document.js';

export class DocumentProcessingRequestedEvent implements DomainEvent {
  occurredAt = new Date();
  readonly contentVersion: number | null;

  constructor(public readonly document: Document) {
    this.contentVersion = document.content?.version ?? null;
  }

  getAggregateId(): UniqueEntityId {
    return this.document.id;
  }
}
