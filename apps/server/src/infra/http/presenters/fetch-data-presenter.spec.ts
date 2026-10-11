import { FetchDataPresenter } from './fetch-data-presenter.js';

describe('FetchDataPresenter', () => {
  it('should convert document data to the public HTTP contract', () => {
    expect(
      FetchDataPresenter.toHTTP({
        id: 'document-1',
        organizationId: 'organization-1',
        name: 'bot-knowledge.pdf',
        contentType: 'application/pdf',
        status: 'PENDING',
        updatedAt: new Date('2026-10-11T12:00:00.000Z'),
      }),
    ).toEqual({
      id: 'document-1',
      type: 'PDF',
      url: 'bot-knowledge.pdf',
      status: 'PENDING',
      lastUpdatedAt: '2026-10-11T12:00:00.000Z',
    });
  });
});
