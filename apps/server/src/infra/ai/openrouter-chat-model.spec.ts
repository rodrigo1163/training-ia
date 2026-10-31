import {
  DEFAULT_CHAT_MODEL_ID,
  STARTER_QUESTIONS_MODEL_ID,
} from '@training-ia/contracts';
import type { EnvService } from '@/infra/env/env.service';
import { OpenRouterChatModelFactory } from './openrouter-chat-model';

describe('OpenRouterChatModelFactory', () => {
  it('caches models by model and generation parameters', () => {
    const env = {
      get: () => 'test-openrouter-key',
    } as unknown as EnvService;
    const factory = new OpenRouterChatModelFactory(env);

    const first = factory.create({
      model: null,
      temperature: null,
      maxTokens: null,
    });
    const second = factory.create({
      model: DEFAULT_CHAT_MODEL_ID,
      temperature: null,
      maxTokens: null,
    });
    const different = factory.create({
      model: DEFAULT_CHAT_MODEL_ID,
      temperature: 0.7,
      maxTokens: null,
    });

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first.model).toBe(DEFAULT_CHAT_MODEL_ID);
  });

  it('creates the secondary catalog model independently', () => {
    const env = {
      get: () => 'test-openrouter-key',
    } as unknown as EnvService;
    const factory = new OpenRouterChatModelFactory(env);

    const model = factory.create({
      model: STARTER_QUESTIONS_MODEL_ID,
      temperature: null,
      maxTokens: null,
    });

    expect(model.model).toBe(STARTER_QUESTIONS_MODEL_ID);
  });
});
