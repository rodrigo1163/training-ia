import { Entity } from '@training-ia/core/entities/entity';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type { Optional } from '@training-ia/core/types/optional';

export type ChatMessageRole = 'USER' | 'ASSISTANT';
export type ChatMessageStatus = 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED';

export interface ChatPageContext {
  pageUrl?: string;
  pageTitle?: string;
  locale?: string;
}

export interface ChatMessageProps {
  conversationId: UniqueEntityId;
  clientMessageId: string | null;
  role: ChatMessageRole;
  status: ChatMessageStatus;
  content: string;
  context: ChatPageContext | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class InvalidChatMessageTransitionError extends Error {
  constructor(from: ChatMessageStatus, to: ChatMessageStatus) {
    super(`Cannot transition chat message from ${from} to ${to}.`);
  }
}

export class ChatMessage extends Entity<ChatMessageProps> {
  get conversationId() { return this.props.conversationId; }
  get clientMessageId() { return this.props.clientMessageId; }
  get role() { return this.props.role; }
  get status() { return this.props.status; }
  get content() { return this.props.content; }
  get context() { return this.props.context; }
  get model() { return this.props.model; }
  get inputTokens() { return this.props.inputTokens; }
  get outputTokens() { return this.props.outputTokens; }
  get errorCode() { return this.props.errorCode; }
  get errorMessage() { return this.props.errorMessage; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  markStreaming() {
    this.transition('STREAMING', ['PENDING']);
  }

  complete(content: string, model: string, inputTokens?: number, outputTokens?: number) {
    this.transition('COMPLETED', ['PENDING', 'STREAMING']);
    this.props.content = content;
    this.props.model = model;
    this.props.inputTokens = inputTokens ?? null;
    this.props.outputTokens = outputTokens ?? null;
  }

  fail(code: string, message: string) {
    this.transition('FAILED', ['PENDING', 'STREAMING']);
    this.props.errorCode = code;
    this.props.errorMessage = message;
  }

  private transition(next: ChatMessageStatus, validCurrent: ChatMessageStatus[]) {
    if (!validCurrent.includes(this.props.status)) {
      throw new InvalidChatMessageTransitionError(this.props.status, next);
    }
    this.props.status = next;
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<ChatMessageProps, 'clientMessageId' | 'content' | 'context' | 'model' | 'inputTokens' | 'outputTokens' | 'errorCode' | 'errorMessage' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ) {
    return new ChatMessage(
      {
        ...props,
        clientMessageId: props.clientMessageId ?? null,
        content: props.content ?? '',
        context: props.context ?? null,
        model: props.model ?? null,
        inputTokens: props.inputTokens ?? null,
        outputTokens: props.outputTokens ?? null,
        errorCode: props.errorCode ?? null,
        errorMessage: props.errorMessage ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
