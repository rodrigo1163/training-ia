import { Injectable } from '@nestjs/common';
import { Prisma } from '@training-ia/database/client';
import {
  KnowledgeRetriever,
  type KnowledgeChunk,
} from '@/domain/application/services/knowledge-retriever';
import { EmbeddingGenerator } from '@/domain/application/services/embedding-generator';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { OPENROUTER_EMBEDDING_MODEL } from './openrouter-embedding-generator.js';

@Injectable()
export class PrismaKnowledgeRetriever implements KnowledgeRetriever {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingGenerator,
  ) {}

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
      embedding.length !== 1536 ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error('The query embedding has an invalid shape.');
    }
    const vector = `[${embedding.join(',')}]`;
    const limit = Math.min(Math.max(requestedLimit ?? 5, 1), 5);

    const rows = await this.prisma.$queryRaw<
      Array<{
        documentId: string;
        chunkId: string;
        documentName: string;
        text: string;
        score: number;
      }>
    >(Prisma.sql`
      SELECT
        d.id AS "documentId",
        c.id AS "chunkId",
        d.name AS "documentName",
        c.text,
        1 - (e.embedding <=> CAST(${vector} AS vector)) AS score
      FROM document_chunk_embedding e
      JOIN document_chunk c ON c.id = e."chunkId"
      JOIN document d ON d.id = c."documentId"
      JOIN document_content dc ON dc."documentId" = d.id
      WHERE d."botId" = ${botId}
        AND d.status = 'READY'::"DocumentStatus"
        AND c."contentVersion" = dc.version
        AND e.model = ${OPENROUTER_EMBEDDING_MODEL}
        AND e.embedding IS NOT NULL
      ORDER BY e.embedding <=> CAST(${vector} AS vector)
      LIMIT ${limit}
    `);

    return rows.map((row) => ({ ...row, score: Number(row.score) }));
  }
}
