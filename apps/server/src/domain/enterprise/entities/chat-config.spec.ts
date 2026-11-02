import {
  createDefaultChatConfig,
  InvalidChatConfigError,
  MAX_CHAT_MESSAGE_LIMIT,
  validateChatConfig,
  type ChatConfig,
} from './chat-config';

function makeChatConfig(override: Partial<ChatConfig> = {}): ChatConfig {
  return {
    ...createDefaultChatConfig(),
    ...override,
  };
}

describe('ChatConfig', () => {
  it('accepts a valid configuration', () => {
    expect(
      validateChatConfig(
        makeChatConfig({
          starterQuestions: ['How does it work?', 'What can you do?'],
          chatBackgroundColor: '#ffffff',
          temperature: 0.7,
          maxTokens: 1000,
          maxMessagesPerDay: 100,
          maxUserMessagesPerConversation: 20,
        }),
      ),
    ).toBeNull();
  });

  it('accepts null as unlimited for both message limits', () => {
    expect(
      validateChatConfig(
        makeChatConfig({
          maxMessagesPerDay: null,
          maxUserMessagesPerConversation: null,
        }),
      ),
    ).toBeNull();
  });

  it('rejects more than three starter questions', () => {
    expect(
      validateChatConfig(
        makeChatConfig({
          starterQuestions: ['One', 'Two', 'Three', 'Four'],
        }),
      ),
    ).toBeInstanceOf(InvalidChatConfigError);
  });

  it('rejects duplicate starter questions after normalization', () => {
    expect(
      validateChatConfig(
        makeChatConfig({
          starterQuestions: ['How does it work?', '  how   does it work?  '],
        }),
      ),
    ).toMatchObject({ message: 'Starter questions must be unique.' });
  });

  it('rejects invalid colors and numeric ranges', () => {
    expect(
      validateChatConfig(
        makeChatConfig({
          chatBackgroundColor: 'not-a-color',
        }),
      ),
    ).toMatchObject({
      message: 'chatBackgroundColor must be a valid CSS color.',
    });

    expect(
      validateChatConfig(
        makeChatConfig({
          temperature: 3,
        }),
      ),
    ).toMatchObject({ message: 'temperature must be between 0 and 2.' });
  });

  it.each([0, -1, 1.5, MAX_CHAT_MESSAGE_LIMIT + 1])(
    'rejects an invalid daily message limit: %s',
    (limit) => {
      expect(
        validateChatConfig(makeChatConfig({ maxMessagesPerDay: limit })),
      ).toMatchObject({
        message: `maxMessagesPerDay must be an integer between 1 and ${MAX_CHAT_MESSAGE_LIMIT}.`,
      });
    },
  );

  it.each([0, -1, 1.5, MAX_CHAT_MESSAGE_LIMIT + 1])(
    'rejects an invalid conversation message limit: %s',
    (limit) => {
      expect(
        validateChatConfig(
          makeChatConfig({ maxUserMessagesPerConversation: limit }),
        ),
      ).toMatchObject({
        message: `maxUserMessagesPerConversation must be an integer between 1 and ${MAX_CHAT_MESSAGE_LIMIT}.`,
      });
    },
  );
});
