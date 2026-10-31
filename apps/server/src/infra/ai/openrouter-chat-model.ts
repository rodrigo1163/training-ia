import { Injectable } from '@nestjs/common';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
  type ChatModelId,
} from '@training-ia/contracts';
import {
  ChatModel,
  ChatModelFactory,
  ChatModelUnavailableError,
  type ChatGenerationConfig,
  type ChatModelChunk,
  type ChatPromptMessage,
} from '@/domain/application/ai/chat-model';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class OpenRouterChatModelFactory extends ChatModelFactory {
  private readonly cache = new Map<string, ChatModel>();

  constructor(private readonly env: EnvService) {
    super();
  }

  create(config: ChatGenerationConfig): ChatModel {
    const model = config.model ?? DEFAULT_CHAT_MODEL_ID;
    const definition = getChatModelDefinition(model);

    if (!definition) {
      throw new Error(`Chat model ${model} is not in the allowed catalog.`);
    }

    if (config.temperature !== null && !definition.supportsTemperature) {
      throw new Error(`Chat model ${model} does not support temperature.`);
    }

    if (config.maxTokens !== null && !definition.supportsMaxTokens) {
      throw new Error(`Chat model ${model} does not support maxTokens.`);
    }

    if (
      definition.maxTokens !== null &&
      config.maxTokens !== null &&
      config.maxTokens > definition.maxTokens
    ) {
      throw new Error(`maxTokens exceeds the limit for chat model ${model}.`);
    }

    const cacheKey = JSON.stringify({
      model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
    const cachedModel = this.cache.get(cacheKey);

    if (cachedModel) {
      return cachedModel;
    }

    const modelInstance = new OpenRouterChatModel({
      apiKey: this.env.get('OPENROUTER_API_KEY'),
      model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    this.cache.set(cacheKey, modelInstance);
    return modelInstance;
  }
}

class OpenRouterChatModel extends ChatModel {
  readonly model: ChatModelId;
  private readonly client: ChatOpenAI;

  constructor(input: {
    apiKey: string;
    model: ChatModelId;
    temperature: number | null;
    maxTokens: number | null;
  }) {
    super();
    this.model = input.model;
    this.client = new ChatOpenAI({
      apiKey: input.apiKey,
      model: input.model,
      streamUsage: true,
      ...(input.temperature === null
        ? {}
        : { temperature: input.temperature }),
      ...(input.maxTokens === null ? {} : { maxTokens: input.maxTokens }),
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
    });
  }

  async *stream(
    messages: ChatPromptMessage[],
    options: { signal: AbortSignal },
  ): AsyncIterable<ChatModelChunk> {
    const langChainMessages = messages.map((message) =>
      this.toLangChainMessage(message),
    );

    try {
      const stream = await this.client.stream(langChainMessages, {
        signal: options.signal,
      });

      for await (const chunk of stream) {
        const content = typeof chunk.content === 'string' ? chunk.content : '';

        yield {
          content,
          inputTokens: chunk.usage_metadata?.input_tokens,
          outputTokens: chunk.usage_metadata?.output_tokens,
        };
      }
    } catch (error) {
      if (options.signal.aborted || isAbortError(error)) {
        throw error;
      }

      if (isTemporarilyUnavailable(error)) {
        throw new ChatModelUnavailableError(this.model, error);
      }

      throw error;
    }
  }

  private toLangChainMessage(message: ChatPromptMessage) {
    if (message.role === 'system') {
      return new SystemMessage(message.content);
    }

    if (message.role === 'assistant') {
      return new AIMessage(message.content);
    }

    return new HumanMessage(message.content);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (isRecord(error) && error.name === 'AbortError')
  );
}

function isTemporarilyUnavailable(error: unknown): boolean {
  const status = getStatus(error);

  if (status === 408 || status === 429 || (status !== undefined && status >= 500)) {
    return true;
  }

  const code = getString(error, 'code');
  return [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENETUNREACH',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
  ].includes(code ?? '');
}

function getStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;

  const directStatus = error.status;
  if (typeof directStatus === 'number') return directStatus;

  const statusCode = error.statusCode;
  if (typeof statusCode === 'number') return statusCode;

  if (isRecord(error.response) && typeof error.response.status === 'number') {
    return error.response.status;
  }

  if (isRecord(error.cause)) return getStatus(error.cause);

  return undefined;
}

function getString(error: unknown, key: string): string | undefined {
  if (!isRecord(error)) return undefined;
  if (typeof error[key] === 'string') return error[key];

  return isRecord(error.cause) && typeof error.cause[key] === 'string'
    ? error.cause[key]
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
