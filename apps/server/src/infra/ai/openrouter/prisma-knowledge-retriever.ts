import { Injectable } from '@nestjs/common';
import {
  KnowledgeRetriever,
  type KnowledgeChunk,
} from '@/domain/application/ai/knowledge-retriever';
import { EmbeddingGenerator } from '@/domain/application/ai/embedding-generator';
import { KnowledgeRepository } from '@/domain/application/repositories/knowledge-repository';
import {
  OPENROUTER_EMBEDDING_DIMENSIONS,
  OPENROUTER_EMBEDDING_MODEL,
} from './openrouter-embedding-generator';

@Injectable()
export class PrismaKnowledgeRetriever implements KnowledgeRetriever {
  constructor(
    private readonly embeddings: EmbeddingGenerator,
    private readonly knowledgeRepository: KnowledgeRepository,
  ) { }

  async retrieve({
    botId,
    query,
    limit: requestedLimit,
  }: {
    botId: string;
    query: string;
    limit?: number;
  }): Promise<KnowledgeChunk[]> {
    const embedding = await this.embeddings.embedQuery(query);
    if (
      embedding.length !== OPENROUTER_EMBEDDING_DIMENSIONS ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error('The query embedding has an invalid shape.');
    }
    const limit = Math.min(Math.max(requestedLimit ?? 5, 1), 5);

    const knowledgeChunks = await this.knowledgeRepository.findRelevant({
      botId,
      embedding,
      model: OPENROUTER_EMBEDDING_MODEL,
      limit,
    });

    return knowledgeChunks;
  }
}
