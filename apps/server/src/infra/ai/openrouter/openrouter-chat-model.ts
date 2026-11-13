import { Injectable } from '@nestjs/common';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  ChatModel,
  type ChatModelChunk,
  type ChatPromptMessage,
} from '@/domain/application/ai/chat-model';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class OpenRouterChatModel implements ChatModel {
  readonly model: string;
  private readonly client: ChatOpenAI;

  constructor(env: EnvService) {
    this.model = env.get('OPENROUTER_CHAT_MODEL');
    this.client = new ChatOpenAI({
      apiKey: env.get('OPENROUTER_API_KEY'),
      model: this.model,
      streamUsage: true,
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
