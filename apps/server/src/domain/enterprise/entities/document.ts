import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export type DocumentStatus = 'PENDING';

export interface DocumentProps {
  botId: UniqueEntityId;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Document extends Entity<DocumentProps> {
  get botId() {
    return this.props.botId;
  }

  get name() {
    return this.props.name;
  }

  get storageKey() {
    return this.props.storageKey;
  }

  get contentType() {
    return this.props.contentType;
  }

  get size() {
    return this.props.size;
  }

  get status() {
    return this.props.status;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<DocumentProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ) {
    const createdAt = props.createdAt ?? new Date();

    return new Document(
      {
        ...props,
        status: props.status ?? 'PENDING',
        createdAt,
        updatedAt: props.updatedAt ?? createdAt,
      },
      id,
    );
  }
}
