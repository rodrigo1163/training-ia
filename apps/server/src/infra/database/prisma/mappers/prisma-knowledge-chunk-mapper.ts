import { KnowledgeChunk } from '@/domain/enterprise/value-objects/knowledge-chunk';

export interface PrismaKnowledgeChunkRow {
  documentId: string;
  chunkId: string;
  documentName: string;
  text: string;
  score: number | string;
}

export class PrismaKnowledgeChunkMapper {
  static toDomain(row: PrismaKnowledgeChunkRow): KnowledgeChunk {
    return KnowledgeChunk.create({
      documentId: row.documentId,
      chunkId: row.chunkId,
      documentName: row.documentName,
      text: row.text,
      score: Number(row.score),
    });
  }
}
