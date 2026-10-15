import type { ChatMessage, ChatPageContext } from '@/domain/enterprise/entities/chat-message';
import type { ChatConversation } from '@/domain/enterprise/entities/chat-conversation';

export interface CreateChatTurnInput {
  deploymentId: string;
  conversationId?: string;
  origin: string;
  clientMessageId: string;
  content: string;
  context?: ChatPageContext;
}

export interface CreatedChatTurn {
  conversation: ChatConversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface CompleteAssistantInput {
  assistantMessageId: string;
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  citations: Array<{
    documentId: string;
    chunkId: string;
    documentName: string;
    excerpt: string;
    position: number;
    score: number;
  }>;
}

export abstract class ChatRepository {
  abstract findConversationByIdAndDeploymentId(id: string, deploymentId: string): Promise<ChatConversation | null>;
  abstract findMessageByClientMessageId(clientMessageId: string): Promise<ChatMessage | null>;
  abstract hasActiveAssistant(conversationId: string): Promise<boolean>;
  abstract createTurn(input: CreateChatTurnInput): Promise<CreatedChatTurn>;
  abstract findRecentCompletedMessages(conversationId: string, limit: number): Promise<ChatMessage[]>;
  abstract markAssistantStreaming(assistantMessageId: string): Promise<void>;
  abstract completeAssistant(input: CompleteAssistantInput): Promise<void>;
  abstract failAssistant(assistantMessageId: string, code: string, message: string): Promise<void>;
}
