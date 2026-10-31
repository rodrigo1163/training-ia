import type { UseCaseError } from '@/core/errors/use-case-error';
import { CHAT_LIMIT_ERROR_CODES, type ChatLimitErrorCode } from '@training-ia/contracts';

export class PublicChatNotFoundError extends Error implements UseCaseError {
  constructor() { super('Chat deployment or conversation not found.'); }
}

export class OriginNotAllowedError extends Error implements UseCaseError {
  constructor() { super('This origin is not allowed to use the chatbot.'); }
}

export class DuplicateChatMessageError extends Error implements UseCaseError {
  constructor() { super('This client message has already been sent.'); }
}

export class ConversationBusyError extends Error implements UseCaseError {
  constructor() { super('The conversation already has a response in progress.'); }
}

export class ChatLimitReachedError extends Error implements UseCaseError {
  constructor(
    readonly code: ChatLimitErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class ChatDailyMessageLimitReachedError extends ChatLimitReachedError {
  constructor() {
    super(
      CHAT_LIMIT_ERROR_CODES.daily,
      'Este bot atingiu o limite diário de mensagens. Tente novamente amanhã.',
    );
  }
}

export class ChatConversationMessageLimitReachedError extends ChatLimitReachedError {
  constructor() {
    super(
      CHAT_LIMIT_ERROR_CODES.conversation,
      'Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar.',
    );
  }
}
