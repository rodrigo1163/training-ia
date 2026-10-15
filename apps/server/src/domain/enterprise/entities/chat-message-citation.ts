import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export interface ChatMessageCitationProps {
  messageId: UniqueEntityId;
  documentId: UniqueEntityId | null;
  chunkId: UniqueEntityId | null;
  documentName: string;
  excerpt: string;
  position: number;
  score: number;
  createdAt: Date;
}

export class ChatMessageCitation extends Entity<ChatMessageCitationProps> {
  get messageId() { return this.props.messageId; }
  get documentId() { return this.props.documentId; }
  get chunkId() { return this.props.chunkId; }
  get documentName() { return this.props.documentName; }
  get excerpt() { return this.props.excerpt; }
  get position() { return this.props.position; }
  get score() { return this.props.score; }
  get createdAt() { return this.props.createdAt; }

  static create(
    props: Optional<ChatMessageCitationProps, 'documentId' | 'chunkId' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    return new ChatMessageCitation(
      {
        ...props,
        documentId: props.documentId ?? null,
        chunkId: props.chunkId ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
