import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export interface DocumentContentProps {
  documentId: UniqueEntityId;
  markdown: string;
  processedAt: Date;
  version: number;
}

export class DocumentContent extends Entity<DocumentContentProps> {
  get documentId() {
    return this.props.documentId;
  }

  get markdown() {
    return this.props.markdown;
  }

  get processedAt() {
    return this.props.processedAt;
  }

  get version() {
    return this.props.version;
  }

  static create(
    props: Optional<DocumentContentProps, 'processedAt'>,
    id?: UniqueEntityId,
  ) {
    return new DocumentContent(
      {
        ...props,
        processedAt: props.processedAt ?? new Date(),
      },
      id ?? props.documentId,
    );
  }
}
