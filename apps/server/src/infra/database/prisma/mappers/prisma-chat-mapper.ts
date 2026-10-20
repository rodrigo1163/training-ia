import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { ChatConversation } from '@/domain/enterprise/entities/chat-conversation';
import { ChatMessage, type ChatPageContext } from '@/domain/enterprise/entities/chat-message';
import type { ChatConversation as PrismaChatConversation, ChatMessage as PrismaChatMessage } from '@training-ia/database/client';

export class PrismaChatMapper {
  static conversationToDomain(raw: PrismaChatConversation): ChatConversation {
    return ChatConversation.create(
      {
        deploymentId: new UniqueEntityId(raw.deploymentId),
        origin: raw.origin,
        lastMessageAt: raw.lastMessageAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static messageToDomain(raw: PrismaChatMessage): ChatMessage {
    return ChatMessage.create(
      {
        conversationId: new UniqueEntityId(raw.conversationId),
        clientMessageId: raw.clientMessageId,
        role: raw.role,
        status: raw.status,
        content: raw.content,
        context: raw.context as ChatPageContext | null,
        model: raw.model,
        inputTokens: raw.inputTokens,
        outputTokens: raw.outputTokens,
        errorCode: raw.errorCode,
        errorMessage: raw.errorMessage,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }
}
