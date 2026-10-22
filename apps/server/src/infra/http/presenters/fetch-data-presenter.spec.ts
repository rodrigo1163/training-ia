import { FetchDataPresenter } from './fetch-data-presenter.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';

describe('FetchDataPresenter', () => {
  it('should convert document data to the public HTTP contract', () => {
    expect(
      FetchDataPresenter.toHTTP(
        (() => {
          const document = makeDocument(
            {
              botId: new UniqueEntityId('bot-1'),
              name: 'bot-knowledge.pdf',
              updatedAt: new Date('2026-10-11T12:00:00.000Z'),
            },
            new UniqueEntityId('document-1'),
          );

          return DocumentDetails.create({
            documentId: document.id,
            botId: document.botId,
            name: document.name,
            storageKey: document.storageKey,
            contentType: document.contentType,
            size: document.size,
            textHash: document.textHash,
            status: document.status,
            markdown: '',
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          });
        })(),
      ),
    ).toEqual({
      id: 'document-1',
      type: 'PDF',
      url: 'bot-knowledge.pdf',
      status: 'PENDING',
      size: 1024,
      lastUpdatedAt: '2026-10-11T12:00:00.000Z',
    });
  });

  it('should expose DOCX documents as DOCX', () => {
    const document = makeDocument(
      {
        botId: new UniqueEntityId('bot-1'),
        name: 'bot-knowledge.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      new UniqueEntityId('document-docx'),
    );

    expect(
      FetchDataPresenter.toHTTP(
        DocumentDetails.create({
          documentId: document.id,
          botId: document.botId,
          name: document.name,
          storageKey: document.storageKey,
          contentType: document.contentType,
          size: document.size,
          status: document.status,
          markdown: '',
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }),
      ).type,
    ).toBe('DOCX');
  });

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
      FetchDataPresenter.toHTTP(
        DocumentDetails.create({
          documentId: document.id,
          botId: document.botId,
          name: document.name,
          storageKey: document.storageKey,
          contentType: document.contentType,
          size: document.size,
          status: document.status,
          markdown: '',
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }),
      ).type,
    ).toBe('DOC');
  });
});
