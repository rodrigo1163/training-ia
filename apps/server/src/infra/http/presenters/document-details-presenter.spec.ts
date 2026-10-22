import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';
import { DocumentDetailsPresenter } from './document-details-presenter.js';

describe('DocumentDetailsPresenter', () => {
  it('should expose DOC documents as DOC', () => {
    const document = makeDocument(
      {
        botId: new UniqueEntityId('bot-1'),
        name: 'bot-knowledge.doc',
        contentType: 'application/msword',
      },
      new UniqueEntityId('document-doc'),
    );

    expect(
      DocumentDetailsPresenter.toHTTP(
        DocumentDetails.create({
          documentId: document.id,
          botId: document.botId,
          name: document.name,
          storageKey: document.storageKey,
          contentType: document.contentType,
          size: document.size,
          status: document.status,
          markdown: '# Title',
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }),
        '/documents/document-doc/file',
      ),
    ).toMatchObject({
      id: 'document-doc',
      type: 'DOC',
      title: 'bot-knowledge.doc',
      url: '/documents/document-doc/file',
      markdown: '# Title',
    });
  });
});
