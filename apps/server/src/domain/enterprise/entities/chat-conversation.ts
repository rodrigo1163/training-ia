import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export interface ChatConversationProps {
  deploymentId: UniqueEntityId;
  origin: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date | null;
}

export class ChatConversation extends Entity<ChatConversationProps> {
  get deploymentId() { return this.props.deploymentId; }
  get origin() { return this.props.origin; }
  get lastMessageAt() { return this.props.lastMessageAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  registerMessage(at = new Date()) {
    this.props.lastMessageAt = at;
    this.props.updatedAt = at;
  }

  static create(
    props: Optional<ChatConversationProps, 'lastMessageAt' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ) {
    const createdAt = props.createdAt ?? new Date();
    return new ChatConversation(
      {
        ...props,
        lastMessageAt: props.lastMessageAt ?? createdAt,
        createdAt,
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
