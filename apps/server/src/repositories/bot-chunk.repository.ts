import { and, cosineDistance, eq, gt, inArray, sql } from 'drizzle-orm'

import { INGESTION_CONFIG } from '../config/ingestion.js'
import { db as defaultDb } from '../db/index.js'
import { botChunk, botSource } from '../db/bot-schema.js'

type DbClient = typeof defaultDb

export type RetrievedChunk = {
  id: number
  sourceId: string
  content: string
  pageNumber: number | null
  similarity: number
  title: string
}

export class BotChunkRepository {
  constructor(private readonly db: DbClient = defaultDb) {}

  async searchSimilar(input: {
    organizationId: string
    botId: string
    embedding: number[]
    topK?: number
    threshold?: number
    fallbackFloor?: number
  }): Promise<RetrievedChunk[]> {
    const topK = input.topK ?? INGESTION_CONFIG.topK
    const threshold = input.threshold ?? INGESTION_CONFIG.similarityThreshold
    const fallbackFloor =
      input.fallbackFloor ?? INGESTION_CONFIG.similarityFallbackFloor

    const ranked = await this.rankBySimilarity({
      organizationId: input.organizationId,
      botId: input.botId,
      embedding: input.embedding,
      limit: topK,
    })

    const aboveThreshold = ranked.filter((row) => row.similarity > threshold)
    if (aboveThreshold.length > 0) {
      return aboveThreshold
    }

    // Perguntas amplas ("explique o currículo") costumam ficar abaixo do limiar
    // mesmo com chunks relevantes. Devolve o topo se passar de um piso mínimo.
    return ranked.filter((row) => row.similarity > fallbackFloor)
  }

  private async rankBySimilarity(input: {
    organizationId: string
    botId: string
    embedding: number[]
    limit: number
  }): Promise<RetrievedChunk[]> {
    const distance = cosineDistance(botChunk.embedding, input.embedding)
    const similarity = sql<number>`1 - (${distance})`

    const readySources = this.db
      .select({ id: botSource.id })
      .from(botSource)
      .where(
        and(
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          eq(botSource.status, 'ready'),
        ),
      )

    const rows = await this.db
      .select({
        id: botChunk.id,
        sourceId: botChunk.sourceId,
        content: botChunk.content,
        pageNumber: botChunk.pageNumber,
        similarity,
        title: botSource.originalFilename,
      })
      .from(botChunk)
      .innerJoin(botSource, eq(botChunk.sourceId, botSource.id))
      .where(
        and(
          eq(botChunk.organizationId, input.organizationId),
          eq(botChunk.botId, input.botId),
          inArray(botChunk.sourceId, readySources),
          gt(similarity, 0),
        ),
      )
      .orderBy(distance)
      .limit(input.limit)

    return rows.map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      content: row.content,
      pageNumber: row.pageNumber,
      similarity: Number(row.similarity),
      title: row.title,
    }))
  }
}
