import { Entity } from '../../../core/entities/entity.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';

export interface DocumentProps {
  documentId: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: Date;
}

export class Document extends Entity<DocumentProps> {
  get documentId() {
    return this.props.documentId;
  }

  get uploadUrl() {
    return this.props.uploadUrl;
  }

  get method() {
    return this.props.method;
  }

  get headers() {
    return this.props.headers;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  static create(props: DocumentProps, id?: UniqueEntityId) {
    return new Document(props, id);
  }
}
