import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { ValueObject } from '@training-ia/core/entities/value-object';
import type { DocumentStatus } from '../entities/document.js';
import type { JsonValue } from '@training-ia/core/types/json-value';

export interface DocumentDetailsProps {
  documentId: UniqueEntityId;
  botId: UniqueEntityId;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  textHash?: string;
  status: DocumentStatus;
  text: string;
  content?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentDetails extends ValueObject<DocumentDetailsProps> {
  get documentId() {
    return this.props.documentId;
  }

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

  get textHash() {
    return this.props.textHash;
  }

  get status() {
    return this.props.status;
  }

  get text() {
    return this.props.text;
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

  static create(props: DocumentDetailsProps) {
    return new DocumentDetails(props);
  }
}
