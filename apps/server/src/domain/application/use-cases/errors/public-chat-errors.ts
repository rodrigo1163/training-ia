import type { UseCaseError } from '@/core/errors/use-case-error';

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
