export interface ChatPromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatModelChunk {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

export abstract class ChatModel {
  abstract readonly model: string;
  abstract stream(
    messages: ChatPromptMessage[],
    options: { signal: AbortSignal },
  ): AsyncIterable<ChatModelChunk>;
}
