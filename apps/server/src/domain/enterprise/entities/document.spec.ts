import { AggregateRoot } from '@training-ia/core/entities/aggregate-root';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { DocumentProcessingRequestedEvent } from '../events/document-processing-requested-event.js';
import { Document } from './document.js';

describe('Document', () => {
  it('creates a pending document with domain defaults', () => {
    const document = Document.create({
      botId: new UniqueEntityId('bot-1'),
      name: 'knowledge.pdf',
      storageKey: 'documents/knowledge.pdf',
      contentType: 'application/pdf',
      size: 1024,
    });

    expect(document.id).toBeInstanceOf(UniqueEntityId);
    expect(document).toBeInstanceOf(AggregateRoot);
    expect(document.botId.toString()).toBe('bot-1');
    expect(document.status).toBe('PENDING');
    expect(document.createdAt).toBeInstanceOf(Date);
    expect(document.updatedAt).toEqual(document.createdAt);
  });

  it('preserves a provided identity and timestamps', () => {
    const id = new UniqueEntityId('document-1');
    const createdAt = new Date('2026-10-10T12:00:00.000Z');
    const updatedAt = new Date('2026-10-11T12:00:00.000Z');
    const document = Document.create(
      {
        botId: new UniqueEntityId('bot-1'),
        name: 'knowledge.pdf',
        storageKey: 'documents/knowledge.pdf',
        contentType: 'application/pdf',
        size: 1024,
        createdAt,
        updatedAt,
      },
      id,
    );

    expect(document.id).toEqual(id);
    expect(document.createdAt).toEqual(createdAt);
    expect(document.updatedAt).toEqual(updatedAt);
  });

  it('requests processing through a domain event', () => {
    const document = Document.create({
      botId: new UniqueEntityId('bot-1'),
      name: 'knowledge.pdf',
      storageKey: 'documents/knowledge.pdf',
      contentType: 'application/pdf',
      size: 1024,
    });

    document.startProcessing();

    expect(document.status).toBe('PROCESSING');
    expect(document.domainEvents).toHaveLength(1);
    expect(document.domainEvents[0]).toBeInstanceOf(
      DocumentProcessingRequestedEvent,
    );
  });
});
