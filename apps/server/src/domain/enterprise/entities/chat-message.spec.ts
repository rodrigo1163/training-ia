import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import {
  ChatMessage,
  InvalidChatMessageTransitionError,
} from './chat-message';

describe('ChatMessage', () => {
  it('creates an aggregate with pending defaults', () => {
    const message = ChatMessage.create({
      conversationId: new UniqueEntityId('conversation-1'),
      role: 'ASSISTANT',
      status: 'PENDING',
    });

    expect(message).toBeInstanceOf(AggregateRoot);
    expect(message.content).toBe('');
    expect(message.model).toBeNull();
  });

  it('allows the streaming lifecycle transitions', () => {
    const message = ChatMessage.create({
      conversationId: new UniqueEntityId('conversation-1'),
      role: 'ASSISTANT',
      status: 'PENDING',
    });

    message.markStreaming();
    message.complete('Answer', 'model-1', 10, 20);

    expect(message.status).toBe('COMPLETED');
    expect(message.content).toBe('Answer');
    expect(message.model).toBe('model-1');
    expect(message.inputTokens).toBe(10);
    expect(message.outputTokens).toBe(20);
  });

  it('rejects invalid transitions', () => {
    const message = ChatMessage.create({
      conversationId: new UniqueEntityId('conversation-1'),
      role: 'ASSISTANT',
      status: 'COMPLETED',
    });

    expect(() => message.markStreaming()).toThrow(
      InvalidChatMessageTransitionError,
    );
  });
});
