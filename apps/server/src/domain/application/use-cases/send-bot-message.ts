import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatModelId,
} from '@training-ia/contracts';
import { Either, left, right } from '@/core/either';
import type { Bot } from '../../enterprise/entities/bot';
import type {
  ChatMessage,
  ChatPageContext,
} from '../../enterprise/entities/chat-message';
import { BotRepository } from '../repositories/bot-repository';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { ChatRepository } from '../repositories/chat-repository';
import {
  ChatModelFactory,
  ChatModelUnavailableError,
  type ChatGenerationConfig,
  type ChatModel,
} from '../ai/chat-model';
import { buildChatPrompt } from '../ai/chat-prompt-builder';
import { KnowledgeRetriever } from '../ai/knowledge-retriever';
import {
  ConversationBusyError,
  DuplicateChatMessageError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
  ChatDailyMessageLimitReachedError,
  ChatConversationMessageLimitReachedError,
} from './errors/public-chat-errors';

export type SendBotMessageError =
  | PublicChatNotFoundError
  | OriginNotAllowedError
  | DuplicateChatMessageError
  | ConversationBusyError
  | ChatDailyMessageLimitReachedError
  | ChatConversationMessageLimitReachedError;

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

const DEFAULT_INITIAL_MESSAGE = 'Hello! 👋 How can I help you today?';

interface StreamResponseRequest {
  bot: Bot;
  query: string;
  isNewConversation: boolean;
  initialAssistantMessage: ChatMessage | null;
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
    private readonly chatModelFactory: ChatModelFactory,
  ) { }

  private readonly logger = new Logger(SendBotMessageUseCase.name);

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
        botId: bot.id.toString(),
        deploymentId: deployment.id.toString(),
        conversationId,
        origin: normalizedOrigin,
        clientMessageId,
        content,
        context,
        initialMessage:
          bot.chatConfig.initialMessage ?? DEFAULT_INITIAL_MESSAGE,
        maxMessagesPerDay: bot.chatConfig.maxMessagesPerDay,
        maxUserMessagesPerConversation:
          bot.chatConfig.maxUserMessagesPerConversation,
      });
    } catch (error) {
      if (error instanceof ChatDailyMessageLimitReachedError) {
        return left(error);
      }

      if (error instanceof ChatConversationMessageLimitReachedError) {
        return left(error);
      }

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
      initialAssistantMessage: turn.initialAssistantMessage,
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
    initialAssistantMessage,
    conversationId,
    userMessageId,
    assistantMessageId,
    signal,
  }: StreamResponseRequest): AsyncIterable<SendBotMessageEvent> {
    try {
      if (signal.aborted) {
        throw new DOMException('The client disconnected.', 'AbortError');
      }

      yield {
        type: 'metadata',
        data: {
          conversationId,
          userMessageId,
          assistantMessageId,
        },
      };

      const [history, knowledge] = await Promise.all([
        isNewConversation
          ? Promise.resolve(
            initialAssistantMessage ? [initialAssistantMessage] : [],
          )
          : this.chats.findRecentCompletedMessages(conversationId, 20),
        bot.documentCount > 0
          ? this.knowledge.retrieve({
            botId: bot.id.toString(),
            query,
            limit: 5,
          })
          : Promise.resolve([]),
      ]);

      if (signal.aborted) {
        throw new DOMException('The client disconnected.', 'AbortError');
      }

      const prompt = buildChatPrompt({
        bot,
        history,
        knowledge,
        currentQuestion: query,
      });

      await this.chats.markAssistantStreaming(assistantMessageId);

      const generationConfig = this.createGenerationConfig(bot.chatConfig);
      const selectedModel = this.chatModelFactory.create(generationConfig);
      let actualModel = selectedModel;
      let content = '';
      let hasEmittedDelta = false;
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;

      const consume = async function* (model: ChatModel) {
        for await (const chunk of model.stream(prompt, { signal })) {
          if (signal.aborted) {
            throw new DOMException('The client disconnected.', 'AbortError');
          }

          yield chunk;
        }
      };

      const emitChunks = async function* () {
        for await (const chunk of consume(selectedModel)) {
          inputTokens = chunk.inputTokens ?? inputTokens;
          outputTokens = chunk.outputTokens ?? outputTokens;

          if (chunk.content) {
            hasEmittedDelta = true;
            content += chunk.content;
            yield { type: 'delta' as const, data: { content: chunk.content } };
          }
        }
      };

      try {
        for await (const event of emitChunks()) {
          yield event;
        }
      } catch (error) {
        const canFallback =
          error instanceof ChatModelUnavailableError &&
          !hasEmittedDelta &&
          selectedModel.model !== DEFAULT_CHAT_MODEL_ID;

        if (!canFallback) throw error;

        this.logger.warn(
          JSON.stringify({
            event: 'chat_model_fallback',
            originalModel: selectedModel.model,
            fallbackModel: DEFAULT_CHAT_MODEL_ID,
            error: error.cause instanceof Error ? error.cause.message : String(error.cause),
          }),
        );

        actualModel = this.chatModelFactory.create({
          ...generationConfig,
          model: DEFAULT_CHAT_MODEL_ID,
        });

        for await (const chunk of consume(actualModel)) {
          inputTokens = chunk.inputTokens ?? inputTokens;
          outputTokens = chunk.outputTokens ?? outputTokens;

          if (chunk.content) {
            hasEmittedDelta = true;
            content += chunk.content;
            yield { type: 'delta', data: { content: chunk.content } };
          }
        }
      }

      if (signal.aborted) {
        throw new DOMException('The client disconnected.', 'AbortError');
      }

      await this.chats.completeAssistant({
        assistantMessageId,
        content,
        model: actualModel.model,
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
        data: { model: actualModel.model, inputTokens, outputTokens },
      };
    } catch (error) {
      const disconnected =
        signal.aborted ||
        (error instanceof DOMException && error.name === 'AbortError');
      const code = disconnected ? 'client_disconnected' : 'generation_failed';
      const message = disconnected
        ? 'The client disconnected.'
        : 'The response could not be generated.';

      if (!disconnected) {
        this.logger.error(
          JSON.stringify({
            event: 'chat_generation_failed',
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }

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

  private createGenerationConfig(config: {
    model: string | null;
    temperature: number | null;
    maxTokens: number | null;
  }): ChatGenerationConfig {
    if (config.model !== null && !isChatModelId(config.model)) {
      throw new Error(`Chat model ${config.model} is not in the allowed catalog.`);
    }

    return {
      model: config.model as ChatModelId | null,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };
  }
}
