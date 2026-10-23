import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { ChatConversation } from './chat-conversation';

describe('ChatConversation', () => {
  it('creates an aggregate with conversation defaults', () => {
    const conversation = ChatConversation.create({
      deploymentId: new UniqueEntityId('deployment-1'),
      origin: 'https://app.example.com',
    });

    expect(conversation).toBeInstanceOf(AggregateRoot);
    expect(conversation.lastMessageAt).toEqual(conversation.createdAt);
    expect(conversation.updatedAt).toBeNull();
  });

  it('updates its timestamps when a message is registered', () => {
    const conversation = ChatConversation.create({
      deploymentId: new UniqueEntityId('deployment-1'),
      origin: 'https://app.example.com',
    });
    const timestamp = new Date('2026-10-22T12:00:00.000Z');

    conversation.registerMessage(timestamp);

    expect(conversation.lastMessageAt).toEqual(timestamp);
    expect(conversation.updatedAt).toEqual(timestamp);
  });
});
