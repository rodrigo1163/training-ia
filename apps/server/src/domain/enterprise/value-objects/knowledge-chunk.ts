import { ValueObject } from '@/core/entities/value-object';

export interface KnowledgeChunkProps {
  documentId: string;
  chunkId: string;
  documentName: string;
  text: string;
  score: number;
}

export class KnowledgeChunk extends ValueObject<KnowledgeChunkProps> {
  get documentId() {
    return this.props.documentId;
  }

  get chunkId() {
    return this.props.chunkId;
  }

  get documentName() {
    return this.props.documentName;
  }

  get text() {
    return this.props.text;
  }

  get score() {
    return this.props.score;
  }

  static create(props: KnowledgeChunkProps) {
    return new KnowledgeChunk(props);
  }
}
