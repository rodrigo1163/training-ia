import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '@/core/either';
import type { ChatPageContext } from '@/domain/enterprise/entities/chat-message';
import type { Bot } from '@/domain/enterprise/entities/bot';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';
import { ChatRepository } from '../repositories/chat-repository.js';
import { KnowledgeRetriever } from '../services/knowledge-retriever.js';
import { ChatModel } from '../services/chat-model.js';
import { buildChatPrompt } from '../services/chat-prompt-builder.js';
import { ConversationBusyError, DuplicateChatMessageError, OriginNotAllowedError, PublicChatNotFoundError } from './errors/public-chat-errors.js';

export type SendBotMessageError = PublicChatNotFoundError | OriginNotAllowedError | DuplicateChatMessageError | ConversationBusyError;

export type SendBotMessageEvent =
  | { type: 'metadata'; data: { conversationId: string; userMessageId: string; assistantMessageId: string } }
  | { type: 'delta'; data: { content: string } }
  | { type: 'completed'; data: { model: string; inputTokens?: number; outputTokens?: number } }
  | { type: 'error'; data: { code: string; message: string } };

export interface SendBotMessageOutput {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  events: AsyncIterable<SendBotMessageEvent>;
}

@Injectable()
export class SendBotMessageUseCase {
  constructor(
    private readonly deployments: BotDeploymentRepository,
    private readonly bots: BotRepository,
    private readonly chats: ChatRepository,
    private readonly knowledge: KnowledgeRetriever,
    private readonly chatModel: ChatModel,
  ) { }

  async execute(input: {
    deploymentKey: string;
    origin: string | undefined;
    conversationId?: string;
    clientMessageId: string;
    content: string;
    context?: ChatPageContext;
    signal: AbortSignal;
  }): Promise<Either<SendBotMessageError, SendBotMessageOutput>> {
    // Válidações
    const deployment = await this.deployments.findByPublicKey(input.deploymentKey);
    if (!deployment || deployment.status !== 'ACTIVE') {
      return left(new PublicChatNotFoundError());
    }

    const normalizedOrigin = this.normalizeOrigin(input.origin);
    const isOriginAllowed = normalizedOrigin !== null && deployment.allowedOrigins.includes(normalizedOrigin);
    if (!isOriginAllowed) {
      return left(new OriginNotAllowedError());
    }
    // Válidações

    if (input.conversationId) {
      const conversation = await this.chats.findConversationByIdAndDeploymentId(input.conversationId, deployment.id.toString());
      if (!conversation) {
        return left(new PublicChatNotFoundError());
      }
      if (conversation.origin !== normalizedOrigin) {
        return left(new OriginNotAllowedError());
      }
      const hasActiveAssistant = await this.chats.hasActiveAssistant(conversation.id.toString());
      if (hasActiveAssistant) {
        return left(new ConversationBusyError());
      }
    }

    const existingMessage = await this.chats.findMessageByClientMessageId(input.clientMessageId);
    if (existingMessage) {
      return left(new DuplicateChatMessageError());
    }

    const bot = await this.bots.findById(deployment.botId.toString());
    if (!bot) {
      return left(new PublicChatNotFoundError());
    }

    let turn;
    try {
      turn = await this.chats.createTurn({
        deploymentId: deployment.id.toString(),
        conversationId: input.conversationId,
        origin: normalizedOrigin,
        clientMessageId: input.clientMessageId,
        content: input.content,
        context: input.context,
      });
    } catch (error) {
      const existingMessage = await this.chats.findMessageByClientMessageId(input.clientMessageId);
      if (existingMessage) {
        return left(new DuplicateChatMessageError());
      }
      const hasActiveAssistant = input.conversationId
        ? await this.chats.hasActiveAssistant(input.conversationId)
        : false;
      if (hasActiveAssistant) {
        return left(new ConversationBusyError());
      }
      throw error;
    }

    const conversationId = turn.conversation.id.toString();
    const userMessageId = turn.userMessage.id.toString();
    const assistantMessageId = turn.assistantMessage.id.toString();
    const events = this.streamResponse({
      bot,
      query: input.content,
      conversationId,
      userMessageId,
      assistantMessageId,
      signal: input.signal,
    });

    return right({ conversationId, userMessageId, assistantMessageId, events });
  }

  private async *streamResponse(input: {
    bot: Bot;
    query: string;
    conversationId: string;
    userMessageId: string;
    assistantMessageId: string;
    signal: AbortSignal;
  }): AsyncIterable<SendBotMessageEvent> {
    yield {
      type: 'metadata',
      data: {
        conversationId: input.conversationId,
        userMessageId: input.userMessageId,
        assistantMessageId: input.assistantMessageId,
      },
    };

    try {
      const [history, knowledge] = await Promise.all([
        this.chats.findRecentCompletedMessages(input.conversationId, 20),
        this.knowledge.retrieve({ botId: input.bot.id.toString(), query: input.query, limit: 5 }),
      ]);
      const prompt = buildChatPrompt({ bot: input.bot, history, knowledge });
      await this.chats.markAssistantStreaming(input.assistantMessageId);

      let content = '';
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;
      for await (const chunk of this.chatModel.stream(prompt, { signal: input.signal })) {
        if (input.signal.aborted) throw new DOMException('The client disconnected.', 'AbortError');
        inputTokens = chunk.inputTokens ?? inputTokens;
        outputTokens = chunk.outputTokens ?? outputTokens;
        if (chunk.content) {
          content += chunk.content;
          yield { type: 'delta', data: { content: chunk.content } };
        }
      }

      await this.chats.completeAssistant({
        assistantMessageId: input.assistantMessageId,
        content,
        model: this.chatModel.model,
        inputTokens,
        outputTokens,
        citations: knowledge.map((chunk, position) => ({
          documentId: chunk.documentId,
          chunkId: chunk.chunkId,
          documentName: chunk.documentName,
          excerpt: chunk.text,
          position,
          score: chunk.score,
        })),
      });
      yield { type: 'completed', data: { model: this.chatModel.model, inputTokens, outputTokens } }
    } catch (error) {
      console.log({ error })
      const disconnected = input.signal.aborted || (error instanceof DOMException && error.name === 'AbortError');
      const code = disconnected ? 'client_disconnected' : 'generation_failed';
      const message = disconnected ? 'The client disconnected.' : 'The response could not be generated.';
      await this.chats.failAssistant(input.assistantMessageId, code, message);
      if (!disconnected) yield { type: 'error', data: { code, message } };
    }
  }

  private normalizeOrigin(origin: string | undefined): string | null {
    if (!origin) return null;
    try {
      const url = new URL(origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
    } catch {
      return null;
    }
  }
}
