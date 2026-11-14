import type { KnowledgeChunk } from '@/domain/enterprise/value-objects/knowledge-chunk';

export type { KnowledgeChunk } from '@/domain/enterprise/value-objects/knowledge-chunk';

export abstract class KnowledgeRetriever {
  abstract retrieve(input: {
    botId: string;
    query: string;
    limit?: number;
  }): Promise<KnowledgeChunk[]>;
}
