import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { DomainEvents } from '@training-ia/core/events/domain-events';
import type { DocumentProcessingMessage } from '@training-ia/contracts/messaging';
import { DocumentContent } from '../../enterprise/entities/document-content.js';
import { Document } from '../../enterprise/entities/document.js';
import { DocumentProcessingPublisher } from '../messaging/document-processing-publisher.js';
import { OnDocumentCreated } from './on-document-created.js';

class FakeDocumentProcessingPublisher extends DocumentProcessingPublisher {
  public messages: DocumentProcessingMessage[] = [];

  async publish(message: DocumentProcessingMessage): Promise<void> {
    this.messages.push(message);
  }
}

describe('OnDocumentCreated', () => {
  beforeEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it('publishes a message when document processing is requested', async () => {
    const publisher = new FakeDocumentProcessingPublisher();
    new OnDocumentCreated(publisher);

    const document = Document.create({
      botId: new UniqueEntityId('bot-1'),
      name: 'knowledge.txt',
      storageKey: 'documents/knowledge.txt',
      contentType: 'text/plain',
      size: 100,
      content: DocumentContent.create({
        documentId: new UniqueEntityId('document-1'),
        markdown: 'content',
        version: 2,
      }),
    }, new UniqueEntityId('document-1'));

    document.startProcessing();
    await DomainEvents.dispatchEventsForAggregate(document.id);

    expect(publisher.messages).toEqual([
      {
        documentId: 'document-1',
        contentVersion: 2,
      },
    ]);
  });
});
