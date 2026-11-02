import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../prisma/generated/prisma/client';
import type {
  ChatRepository,
  CompleteAssistantInput,
  CreateChatTurnInput,
  CreatedChatTurn,
} from '@/domain/application/repositories/chat-repository';
import type { ChatConversation } from '@/domain/enterprise/entities/chat-conversation';
import type { ChatMessage } from '@/domain/enterprise/entities/chat-message';
import {
  ChatConversationMessageLimitReachedError,
  ChatDailyMessageLimitReachedError,
  DuplicateChatMessageError,
} from '@/domain/application/use-cases/errors/public-chat-errors';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaChatMapper } from '@/infra/database/prisma/mappers/prisma-chat-mapper';

@Injectable()
export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConversationByIdAndDeploymentId(
    id: string,
    deploymentId: string,
  ): Promise<ChatConversation | null> {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id, deploymentId },
    });

    if (!conversation) {
      return null;
    }

    return PrismaChatMapper.conversationToDomain(conversation);
  }

  async findMessageByIdAndConversationId(
    id: string,
    conversationId: string,
  ): Promise<ChatMessage | null> {
    const message = await this.prisma.chatMessage.findFirst({
      where: { id, conversationId },
    });

    if (!message) return null;

    return PrismaChatMapper.messageToDomain(message);
  }

  async findMessageByClientMessageId(
    clientMessageId: string,
  ): Promise<ChatMessage | null> {
    const message = await this.prisma.chatMessage.findUnique({
      where: { clientMessageId },
    });

    if (!message) {
      return null;
    }

    return PrismaChatMapper.messageToDomain(message);
  }

  async hasActiveAssistant(conversationId: string): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: {
        conversationId,
        role: 'ASSISTANT',
        status: { in: ['PENDING', 'STREAMING'] },
      },
    });
    return count > 0;
  }

  async createTurn(input: CreateChatTurnInput): Promise<CreatedChatTurn> {
    const now = new Date();
    const conversationId = input.conversationId ?? randomUUID();
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();

    const result = await this.prisma.$transaction(async (tx) => {
      const existingMessage = await tx.chatMessage.findUnique({
        where: { clientMessageId: input.clientMessageId },
      });

      if (existingMessage) {
        throw new DuplicateChatMessageError();
      }

      const dailyUsage = await this.incrementDailyUsage(
        tx,
        input.botId,
        utcDay(now),
        input.maxMessagesPerDay,
      );

      if (!dailyUsage) {
        throw new ChatDailyMessageLimitReachedError();
      }

      const conversation = input.conversationId
        ? await this.updateExistingConversation(tx, input, conversationId, now)
        : await tx.chatConversation.create({
            data: {
              id: conversationId,
              deploymentId: input.deploymentId,
              origin: input.origin,
              userMessageCount: 1,
              lastMessageAt: now,
            },
          });

      const initialAssistantMessage = input.conversationId
        ? null
        : await tx.chatMessage.create({
            data: {
              id: randomUUID(),
              conversationId,
              role: 'ASSISTANT',
              status: 'COMPLETED',
              content: input.initialMessage,
            },
          });

      const userMessage = await tx.chatMessage.create({
        data: {
          id: userMessageId,
          conversationId,
          clientMessageId: input.clientMessageId,
          role: 'USER',
          status: 'COMPLETED',
          content: input.content,
          context: input.context
            ? (input.context as Prisma.InputJsonValue)
            : undefined,
        },
      });
      const assistantMessage = await tx.chatMessage.create({
        data: {
          id: assistantMessageId,
          conversationId,
          role: 'ASSISTANT',
          status: 'PENDING',
          content: '',
        },
      });
      return {
        conversation,
        initialAssistantMessage,
        userMessage,
        assistantMessage,
      };
    });

    return {
      conversation: PrismaChatMapper.conversationToDomain(result.conversation),
      initialAssistantMessage: result.initialAssistantMessage
        ? PrismaChatMapper.messageToDomain(result.initialAssistantMessage)
        : null,
      userMessage: PrismaChatMapper.messageToDomain(result.userMessage),
      assistantMessage: PrismaChatMapper.messageToDomain(
        result.assistantMessage,
      ),
    };
  }

  private async updateExistingConversation(
    tx: Prisma.TransactionClient,
    input: CreateChatTurnInput,
    conversationId: string,
    now: Date,
  ) {
    const conversation = await tx.chatConversation.findFirst({
      where: { id: conversationId, deploymentId: input.deploymentId },
    });
    if (!conversation) {
      throw new Error('Conversation does not belong to the deployment.');
    }

    const result =
      input.maxUserMessagesPerConversation === null
        ? await tx.chatConversation.updateMany({
            where: { id: conversationId, deploymentId: input.deploymentId },
            data: { userMessageCount: { increment: 1 }, lastMessageAt: now },
          })
        : await tx.chatConversation.updateMany({
            where: {
              id: conversationId,
              deploymentId: input.deploymentId,
              userMessageCount: { lt: input.maxUserMessagesPerConversation },
            },
            data: { userMessageCount: { increment: 1 }, lastMessageAt: now },
          });

    if (result.count !== 1) {
      throw new ChatConversationMessageLimitReachedError();
    }

    return tx.chatConversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
  }

  private async incrementDailyUsage(
    tx: Prisma.TransactionClient,
    botId: string,
    day: string,
    limit: number | null,
  ): Promise<{ userMessageCount: number } | null> {
    const dailyUsageTable = this.prisma.databaseSchema
      ? Prisma.raw(
          `${quoteIdentifier(this.prisma.databaseSchema)}."chat_daily_usage"`,
        )
      : Prisma.raw('"chat_daily_usage"');
    const rows = await tx.$queryRaw<
      Array<{ userMessageCount: number }>
    >(Prisma.sql`
      INSERT INTO ${dailyUsageTable} ("botId", "day", "userMessageCount", "createdAt", "updatedAt")
      VALUES (${botId}, ${day}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("botId", "day") DO UPDATE
      SET "userMessageCount" = ${dailyUsageTable}."userMessageCount" + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      ${
        limit === null
          ? Prisma.empty
          : Prisma.sql`WHERE ${dailyUsageTable}."userMessageCount" < ${limit}`
      }
      RETURNING "userMessageCount"
    `);

    return rows[0] ?? null;
  }

  async findRecentCompletedMessages(
    conversationId: string,
    excludedMessageId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        status: 'COMPLETED',
        id: { not: excludedMessageId },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return messages.reverse().map(PrismaChatMapper.messageToDomain);
  }

  async markAssistantStreaming(assistantMessageId: string): Promise<void> {
    await this.prisma.chatMessage.update({
      where: { id: assistantMessageId },
      data: { status: 'STREAMING' },
    });
  }

  async completeAssistant(input: CompleteAssistantInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.chatMessage.update({
        where: { id: input.assistantMessageId },
        data: {
          status: 'COMPLETED',
          content: input.content,
          model: input.model,
          inputTokens: input.inputTokens,
          outputTokens: input.outputTokens,
        },
      });
      if (input.citations.length > 0) {
        await tx.chatMessageCitation.createMany({
          data: input.citations.map((citation) => ({
            id: randomUUID(),
            messageId: input.assistantMessageId,
            ...citation,
          })),
        });
      }
    });
  }

  async failAssistant(
    assistantMessageId: string,
    code: string,
    message: string,
  ): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        id: assistantMessageId,
        status: { in: ['PENDING', 'STREAMING'] },
      },
      data: { status: 'FAILED', errorCode: code, errorMessage: message },
    });
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function utcDay(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}
