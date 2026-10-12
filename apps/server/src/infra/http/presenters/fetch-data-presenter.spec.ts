import { FetchDataPresenter } from './fetch-data-presenter.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('FetchDataPresenter', () => {
  it('should convert document data to the public HTTP contract', () => {
    expect(
      FetchDataPresenter.toHTTP(
        makeDocument(
          {
            botId: new UniqueEntityId('bot-1'),
            name: 'bot-knowledge.pdf',
            updatedAt: new Date('2026-10-11T12:00:00.000Z'),
          },
          new UniqueEntityId('document-1'),
        ),
      ),
    ).toEqual({
      id: 'document-1',
      type: 'PDF',
      url: 'bot-knowledge.pdf',
      status: 'PENDING',
      lastUpdatedAt: '2026-10-11T12:00:00.000Z',
    });
  });
});
