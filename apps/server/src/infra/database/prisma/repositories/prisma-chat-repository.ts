import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ChatRepository, CompleteAssistantInput, CreateChatTurnInput, CreatedChatTurn } from '@/domain/application/repositories/chat-repository';
import type { ChatConversation } from '@/domain/enterprise/entities/chat-conversation';
import type { ChatMessage } from '@/domain/enterprise/entities/chat-message';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaChatMapper } from '@/infra/database/prisma/mappers/prisma-chat-mapper';

@Injectable()
export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findConversationByIdAndDeploymentId(id: string, deploymentId: string): Promise<ChatConversation | null> {
    const conversation = await this.prisma.chatConversation.findFirst({ where: { id, deploymentId } });

    if (!conversation) {
      return null;
    }

    return PrismaChatMapper.conversationToDomain(conversation);
  }

  async findMessageByClientMessageId(clientMessageId: string): Promise<ChatMessage | null> {
    const message = await this.prisma.chatMessage.findUnique({ where: { clientMessageId } });

    if (!message) {
      return null;
    }

    return PrismaChatMapper.messageToDomain(message);
  }

  async hasActiveAssistant(conversationId: string): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: { conversationId, role: 'ASSISTANT', status: { in: ['PENDING', 'STREAMING'] } },
    });
    return count > 0;
  }

  async createTurn(input: CreateChatTurnInput): Promise<CreatedChatTurn> {
    const now = new Date();
    const conversationId = input.conversationId ?? randomUUID();
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();

    const result = await this.prisma.$transaction(async (tx) => {
      const conversation = input.conversationId
        ? await tx.chatConversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } })
        : await tx.chatConversation.create({
          data: { id: conversationId, deploymentId: input.deploymentId, origin: input.origin, lastMessageAt: now },
        });

      const userMessage = await tx.chatMessage.create({
        data: {
          id: userMessageId,
          conversationId,
          clientMessageId: input.clientMessageId,
          role: 'USER',
          status: 'COMPLETED',
          content: input.content,
          context: JSON.stringify(input?.context) ?? undefined,
        },
      });
      const assistantMessage = await tx.chatMessage.create({
        data: { id: assistantMessageId, conversationId, role: 'ASSISTANT', status: 'PENDING', content: '' },
      });
      return { conversation, userMessage, assistantMessage };
    });

    return {
      conversation: PrismaChatMapper.conversationToDomain(result.conversation),
      userMessage: PrismaChatMapper.messageToDomain(result.userMessage),
      assistantMessage: PrismaChatMapper.messageToDomain(result.assistantMessage),
    };
  }

  async findRecentCompletedMessages(conversationId: string, limit: number): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId, status: 'COMPLETED' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return messages.reverse().map(PrismaChatMapper.messageToDomain);
  }

  async markAssistantStreaming(assistantMessageId: string): Promise<void> {
    await this.prisma.chatMessage.update({ where: { id: assistantMessageId }, data: { status: 'STREAMING' } });
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
          data: input.citations.map((citation) => ({ id: randomUUID(), messageId: input.assistantMessageId, ...citation })),
        });
      }
    });
  }

  async failAssistant(assistantMessageId: string, code: string, message: string): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: { id: assistantMessageId, status: { in: ['PENDING', 'STREAMING'] } },
      data: { status: 'FAILED', errorCode: code, errorMessage: message },
    });
  }
}
