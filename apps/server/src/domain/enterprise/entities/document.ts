import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import type { DocumentContent } from './document-content';

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentProps {
  botId: UniqueEntityId;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  textHash?: string;
  status: DocumentStatus;
  content?: DocumentContent;
  createdAt: Date;
  updatedAt: Date;
}

export class Document extends AggregateRoot<DocumentProps> {
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

  get textHash() {
    return this.props.textHash;
  }

  get content() {
    return this.props.content;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set content(content: DocumentContent | undefined) {
    this.props.content = content;
    this.touch();
  }

  static create(
    props: Optional<
      DocumentProps,
      'status' | 'content' | 'createdAt' | 'updatedAt'
    >,
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
