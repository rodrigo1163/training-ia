import {
  createDefaultChatConfig,
  InvalidChatConfigError,
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
});
