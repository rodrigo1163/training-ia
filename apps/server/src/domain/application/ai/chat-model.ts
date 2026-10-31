import type { ChatModelId } from '@training-ia/contracts';

export interface ChatPromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatModelChunk {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ChatGenerationConfig {
  model: ChatModelId | null;
  temperature: number | null;
  maxTokens: number | null;
}

export class ChatModelUnavailableError extends Error {
  constructor(
    readonly model: ChatModelId,
    readonly cause?: unknown,
  ) {
    super(`Chat model ${model} is temporarily unavailable.`);
    this.name = 'ChatModelUnavailableError';
  }
}

export abstract class ChatModel {
  abstract readonly model: string;
  abstract stream(
    messages: ChatPromptMessage[],
    options: { signal: AbortSignal },
  ): AsyncIterable<ChatModelChunk>;
}

export abstract class ChatModelFactory {
  abstract create(config: ChatGenerationConfig): ChatModel;
}
