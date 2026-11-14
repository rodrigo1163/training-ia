import type { KnowledgeChunk } from '@/domain/enterprise/value-objects/knowledge-chunk';

export interface FindRelevantKnowledgeChunksInput {
  botId: string;
  embedding: number[];
  model: string;
  limit: number;
}

export abstract class KnowledgeRepository {
  abstract findRelevant(
    input: FindRelevantKnowledgeChunksInput,
  ): Promise<KnowledgeChunk[]>;
}
