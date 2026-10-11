import { BotPresenter } from './bot-presenter.js';

describe('Bot presenter', () => {
  it('serializes the public bot contract', () => {
    expect(
      BotPresenter.toHTTP({
        id: 'bot-1',
        organizationId: 'organization-1',
        name: 'Support Bot',
        slug: 'support-bot',
        documentCount: 3,
        createdAt: new Date('2026-10-11T12:00:00.000Z'),
      }),
    ).toEqual({
      id: 'bot-1',
      name: 'Support Bot',
      slug: 'support-bot',
      documentCount: 3,
      createdAt: '2026-10-11T12:00:00.000Z',
    });
  });
});
