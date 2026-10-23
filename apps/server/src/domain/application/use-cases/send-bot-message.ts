import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import type { Bot } from '../../enterprise/entities/bot';
import type { ChatPageContext } from '../../enterprise/entities/chat-message';
import { BotRepository } from '../repositories/bot-repository';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { ChatRepository } from '../repositories/chat-repository';
import { ChatModel } from '../ai/chat-model';
import { buildChatPrompt } from '../ai/chat-prompt-builder';
import { KnowledgeRetriever } from '../ai/knowledge-retriever';
import {
  ConversationBusyError,
  DuplicateChatMessageError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from './errors/public-chat-errors';

export type SendBotMessageError =
  | PublicChatNotFoundError
  | OriginNotAllowedError
  | DuplicateChatMessageError
  | ConversationBusyError;

export type SendBotMessageEvent =
  | {
    type: 'metadata';
    data: {
      conversationId: string;
      userMessageId: string;
      assistantMessageId: string;
    };
  }
  | { type: 'delta'; data: { content: string } }
  | {
    type: 'completed';
    data: { model: string; inputTokens?: number; outputTokens?: number };
  }
  | { type: 'error'; data: { code: string; message: string } };

export interface SendBotMessageOutput {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  events: AsyncIterable<SendBotMessageEvent>;
}

interface SendBotMessageUseCaseRequest {
  deploymentKey: string;
  origin: string | undefined;
  conversationId?: string;
  clientMessageId: string;
  content: string;
  context?: ChatPageContext;
  signal: AbortSignal;
}

type SendBotMessageUseCaseResponse = Either<
  SendBotMessageError,
  SendBotMessageOutput
>;

interface StreamResponseRequest {
  bot: Bot;
  query: string;
  isNewConversation: boolean;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  signal: AbortSignal;
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

  async execute({
    deploymentKey,
    origin,
    conversationId,
    clientMessageId,
    content,
    context,
    signal,
  }: SendBotMessageUseCaseRequest): Promise<SendBotMessageUseCaseResponse> {
    const isNewConversation = conversationId === undefined;
    const deployment = await this.deployments.findByPublicKey(deploymentKey);

    if (!deployment || deployment.status !== 'ACTIVE') {
      return left(new PublicChatNotFoundError());
    }

    const normalizedOrigin = this.normalizeOrigin(origin);
    const isOriginAllowed =
      normalizedOrigin !== null &&
      deployment.allowedOrigins.includes(normalizedOrigin);

    if (!isOriginAllowed) {
      return left(new OriginNotAllowedError());
    }

    if (conversationId) {
      const conversation = await this.chats.findConversationByIdAndDeploymentId(
        conversationId,
        deployment.id.toString(),
      );

      if (!conversation) {
        return left(new PublicChatNotFoundError());
      }

      if (conversation.origin !== normalizedOrigin) {
        return left(new OriginNotAllowedError());
      }

      const hasActiveAssistant = await this.chats.hasActiveAssistant(
        conversation.id.toString(),
      );

      if (hasActiveAssistant) {
        return left(new ConversationBusyError());
      }
    }

    const existingMessage =
      await this.chats.findMessageByClientMessageId(clientMessageId);

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
        conversationId,
        origin: normalizedOrigin,
        clientMessageId,
        content,
        context,
      });
    } catch (error) {
      const existingMessage =
        await this.chats.findMessageByClientMessageId(clientMessageId);

      if (existingMessage) {
        return left(new DuplicateChatMessageError());
      }

      const hasActiveAssistant = conversationId
        ? await this.chats.hasActiveAssistant(conversationId)
        : false;

      if (hasActiveAssistant) {
        return left(new ConversationBusyError());
      }

      throw error;
    }

    const createdConversationId = turn.conversation.id.toString();
    const createdUserMessageId = turn.userMessage.id.toString();
    const createdAssistantMessageId = turn.assistantMessage.id.toString();
    const events = this.streamResponse({
      bot,
      query: content,
      isNewConversation,
      conversationId: createdConversationId,
      userMessageId: createdUserMessageId,
      assistantMessageId: createdAssistantMessageId,
      signal,
    });

    return right({
      conversationId: createdConversationId,
      userMessageId: createdUserMessageId,
      assistantMessageId: createdAssistantMessageId,
      events,
    });
  }

  private async *streamResponse({
    bot,
    query,
    isNewConversation,
    conversationId,
    userMessageId,
    assistantMessageId,
    signal,
  }: StreamResponseRequest): AsyncIterable<SendBotMessageEvent> {
    yield {
      type: 'metadata',
      data: {
        conversationId,
        userMessageId,
        assistantMessageId,
      },
    };

    try {
      const [history, knowledge] = await Promise.all([
        isNewConversation
          ? Promise.resolve([])
          : this.chats.findRecentCompletedMessages(conversationId, 20),
        bot.documentCount > 0
          ? this.knowledge.retrieve({
            botId: bot.id.toString(),
            query,
            limit: 5,
          })
          : Promise.resolve([]),
      ]);

      const prompt = buildChatPrompt({
        bot,
        history,
        knowledge,
        currentQuestion: query,
      });

      await this.chats.markAssistantStreaming(assistantMessageId);

      let content = '';
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;
      for await (const chunk of this.chatModel.stream(prompt, { signal })) {
        if (signal.aborted) {
          throw new DOMException('The client disconnected.', 'AbortError');
        }

        inputTokens = chunk.inputTokens ?? inputTokens;
        outputTokens = chunk.outputTokens ?? outputTokens;

        if (chunk.content) {
          content += chunk.content;
          yield { type: 'delta', data: { content: chunk.content } };
        }
      }

      await this.chats.completeAssistant({
        assistantMessageId,
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
      yield {
        type: 'completed',
        data: { model: this.chatModel.model, inputTokens, outputTokens },
      };
    } catch (error) {
      console.log({ error });
      const disconnected =
        signal.aborted ||
        (error instanceof DOMException && error.name === 'AbortError');
      const code = disconnected ? 'client_disconnected' : 'generation_failed';
      const message = disconnected
        ? 'The client disconnected.'
        : 'The response could not be generated.';

      await this.chats.failAssistant(assistantMessageId, code, message);

      if (!disconnected) {
        yield { type: 'error', data: { code, message } };
      }
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
