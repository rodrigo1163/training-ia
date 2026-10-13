import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';
import type { Document } from '../entities/document.js';

export class DocumentProcessingRequestedEvent implements DomainEvent {
  occurredAt = new Date();

  constructor(public readonly document: Document) {}

  getAggregateId(): UniqueEntityId {
    return this.document.id;
  }
}
