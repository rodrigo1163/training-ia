import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../prisma/generated/prisma/client';
import type {
  FindRelevantKnowledgeChunksInput,
  KnowledgeRepository,
} from '@/domain/application/repositories/knowledge-repository';
import type { KnowledgeChunk } from '@/domain/enterprise/value-objects/knowledge-chunk';
import { PrismaService } from '../prisma.service';
import {
  PrismaKnowledgeChunkMapper,
  type PrismaKnowledgeChunkRow,
} from '../mappers/prisma-knowledge-chunk-mapper';

@Injectable()
export class PrismaKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findRelevant({
    botId,
    embedding,
    model,
    limit,
  }: FindRelevantKnowledgeChunksInput): Promise<KnowledgeChunk[]> {
    const vector = `[${embedding.join(',')}]`;
    const rows = await this.prisma.$queryRaw<PrismaKnowledgeChunkRow[]>(Prisma.sql`
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
        AND e.model = ${model}
        AND e.embedding IS NOT NULL
      ORDER BY e.embedding <=> CAST(${vector} AS vector)
      LIMIT ${limit}
    `);

    return rows.map(PrismaKnowledgeChunkMapper.toDomain);
  }
}
