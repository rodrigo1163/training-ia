import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { DomainEvents } from '@training-ia/core/events/domain-events';
import type { DocumentProcessingMessage } from '@training-ia/contracts/messaging';
import { DocumentContent } from '../../enterprise/entities/document-content.js';
import { Document } from '../../enterprise/entities/document.js';
import { DocumentProcessingPublisher } from '../messaging/document-processing-publisher.js';
import { OnDocumentProcessingRequested } from './on-document-processing-requested.js';

class FakeDocumentProcessingPublisher extends DocumentProcessingPublisher {
  public messages: DocumentProcessingMessage[] = [];

  async publish(message: DocumentProcessingMessage): Promise<void> {
    this.messages.push(message);
  }
}

describe('OnDocumentProcessingRequested', () => {
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
    new OnDocumentProcessingRequested(publisher);

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

  it('publishes a message when document content is updated', async () => {
    const publisher = new FakeDocumentProcessingPublisher();
    new OnDocumentProcessingRequested(publisher);

    const documentId = new UniqueEntityId('document-1');
    const document = Document.create({
      botId: new UniqueEntityId('bot-1'),
      name: 'knowledge.txt',
      storageKey: 'documents/knowledge.txt',
      contentType: 'text/plain',
      size: 100,
      content: DocumentContent.create({
        documentId,
        markdown: 'old content',
        version: 1,
      }),
    }, documentId);

    document.updateContent(
      DocumentContent.create({
        documentId,
        markdown: 'updated content',
        version: 2,
      }),
      'updated-content-hash',
    );
    await DomainEvents.dispatchEventsForAggregate(document.id);

    expect(publisher.messages).toEqual([
      {
        documentId: 'document-1',
        contentVersion: 2,
      },
    ]);
  });
});
