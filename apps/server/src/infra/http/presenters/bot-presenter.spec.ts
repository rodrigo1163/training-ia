import { BotPresenter } from './bot-presenter';
import { makeBot } from '../../../../test/factories/make-bot';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { createDefaultBotStyle } from '@/domain/enterprise/entities/bot-style';

describe('Bot presenter', () => {
  it('serializes the public bot contract', () => {
    expect(
      BotPresenter.toHTTP(
        makeBot(
          {
            orgId: new UniqueEntityId('organization-1'),
            name: 'Support Bot',
            documentCount: 3,
            createdAt: new Date('2026-10-11T12:00:00.000Z'),
          },
          new UniqueEntityId('bot-1'),
        ),
      ),
    ).toEqual({
      id: 'bot-1',
      name: 'Support Bot',
      description: null,
      personality: 'NEUTRAL',
      language: 'pt-BR',
      systemMessage: null,
      chatConfig: {
        inputPlaceholder: null,
        submitButtonText: null,
        showMessageTimestamps: false,
        starterQuestions: [],
        generateStarterQuestionsAfterResponse: false,
        initialMessage: null,
        assistantName: 'Virtual Assistant',
        headerStatusText: null,
        model: null,
        temperature: null,
        maxTokens: null,
        maxMessagesPerDay: null,
        maxUserMessagesPerConversation: null,
      },
      style: createDefaultBotStyle(),
      slug: 'support-bot',
      documentCount: 3,
      createdAt: '2026-10-11T12:00:00.000Z',
    });
  });
});
