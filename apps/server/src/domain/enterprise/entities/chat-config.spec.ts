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

  it('keeps style fields nullable by default', () => {
    expect(createDefaultChatConfig()).toMatchObject({
      chatWidth: null,
      chatHeight: null,
      chatRadius: null,
      messageRadius: null,
      chatShadow: null,
      floatingPosition: null,
      footerBackgroundColor: null,
      inputBackgroundColor: null,
      inputTextColor: null,
      starterQuestionsTextColor: null,
    });
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

  it.each([
    'footerBackgroundColor',
    'inputBackgroundColor',
    'inputTextColor',
    'starterQuestionsTextColor',
  ] as const)('accepts a valid %s color', (field) => {
    expect(
      validateChatConfig(makeChatConfig({ [field]: 'rgba(17, 24, 39, 0.8)' })),
    ).toBeNull();
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

  it.each([
    ['chatWidth', 319],
    ['chatWidth', 601],
    ['chatHeight', 479],
    ['chatHeight', 801],
    ['chatRadius', -1],
    ['chatRadius', 33],
    ['messageRadius', -1],
    ['messageRadius', 25],
  ])('rejects an invalid style value: %s=%s', (field, value) => {
    expect(
      validateChatConfig(makeChatConfig({ [field]: value })),
    ).toBeInstanceOf(InvalidChatConfigError);
  });

  it('rejects unknown shadow and floating position values', () => {
    expect(
      validateChatConfig(makeChatConfig({ chatShadow: 'huge' as never })),
    ).toMatchObject({ message: 'chatShadow must be a valid shadow.' });
    expect(
      validateChatConfig(makeChatConfig({ floatingPosition: 'top' as never })),
    ).toMatchObject({
      message: 'floatingPosition must be a valid position.',
    });
  });
});
