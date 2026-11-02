import {
  CHAT_MODEL_CATALOG,
  DEFAULT_CHAT_MODEL_ID,
  STARTER_QUESTIONS_MODEL_ID,
} from '@training-ia/contracts';
import { createDefaultChatConfig } from '@/domain/enterprise/entities/chat-config';
import { validateChatGenerationConfig } from './chat-generation-config';

describe('chat model catalog', () => {
  it('defines the primary and suggestions models', () => {
    expect(DEFAULT_CHAT_MODEL_ID).toBe('anthropic/claude-sonnet-4.6');
    expect(STARTER_QUESTIONS_MODEL_ID).toBe('anthropic/claude-haiku-5.5');
    expect(CHAT_MODEL_CATALOG).toHaveLength(2);
  });

  it('validates a model configuration against the catalog', () => {
    const config = createDefaultChatConfig();

    expect(
      validateChatGenerationConfig({
        ...config,
        model: 'anthropic/claude-sonnet-4.6',
        temperature: 0.7,
        maxTokens: 1_000,
      }),
    ).toBeNull();
  });

  it('accepts null model as the catalog default', () => {
    const config = createDefaultChatConfig();

    expect(validateChatGenerationConfig(config)).toBeNull();
  });

  it('rejects models outside the catalog', () => {
    const config = createDefaultChatConfig();

    expect(
      validateChatGenerationConfig({
        ...config,
        model: 'provider/unknown-model',
      }),
    ).toMatchObject({
      message: 'model must be one of the allowed chat models.',
    });
  });

  it('rejects the suggestions model as a primary chat model', () => {
    const config = createDefaultChatConfig();

    expect(
      validateChatGenerationConfig({
        ...config,
        model: STARTER_QUESTIONS_MODEL_ID,
      }),
    ).toMatchObject({
      message: 'model must be one of the allowed chat models.',
    });
  });
});
