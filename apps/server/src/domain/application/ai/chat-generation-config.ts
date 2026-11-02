import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
} from '@training-ia/contracts';
import {
  InvalidChatConfigError,
  type ChatConfig,
} from '@/domain/enterprise/entities/chat-config';

export function validateChatGenerationConfig(
  config: Pick<ChatConfig, 'model' | 'temperature' | 'maxTokens'>,
): InvalidChatConfigError | null {
  const model = config.model ?? DEFAULT_CHAT_MODEL_ID;
  const definition = getChatModelDefinition(model);

  if (!definition || definition.purpose !== 'chat') {
    return new InvalidChatConfigError(
      `model must be one of the allowed chat models.`,
    );
  }

  if (config.temperature !== null && !definition.supportsTemperature) {
    return new InvalidChatConfigError(
      `temperature is not supported by model ${model}.`,
    );
  }

  if (config.maxTokens !== null && !definition.supportsMaxTokens) {
    return new InvalidChatConfigError(
      `maxTokens is not supported by model ${model}.`,
    );
  }

  if (
    definition.maxTokens !== null &&
    config.maxTokens !== null &&
    config.maxTokens > definition.maxTokens
  ) {
    return new InvalidChatConfigError(
      `maxTokens must be at most ${definition.maxTokens} for model ${model}.`,
    );
  }

  return null;
}
