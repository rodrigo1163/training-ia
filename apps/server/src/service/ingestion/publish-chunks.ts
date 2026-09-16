import { and, eq } from 'drizzle-orm'

import { taskDb } from '../../db/task-db.js'
import { botChunk, botSource } from '../../db/bot-schema.js'
import { IngestionError } from '../../lib/errors/ingestion-error.js'
import type { EmbeddedChunk } from './embed-chunks.js'

export async function publishChunks(input: {
  sourceId: string
  organizationId: string
  botId: string
  expectedVersion: number
  pageCount: number
  chunks: EmbeddedChunk[]
}): Promise<void> {
  await taskDb.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(botSource)
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
      .for('update')
      .limit(1)

    if (!locked) {
      throw new IngestionError('SOURCE_NOT_FOUND')
    }

    if (
      locked.processingVersion !== input.expectedVersion ||
      locked.status !== 'processing'
    ) {
      throw new IngestionError('VERSION_CONFLICT')
    }

    await tx
      .delete(botChunk)
      .where(eq(botChunk.sourceId, input.sourceId))

    if (input.chunks.length > 0) {
      await tx.insert(botChunk).values(
        input.chunks.map((chunk) => ({
          organizationId: input.organizationId,
          botId: input.botId,
          sourceId: input.sourceId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          contentSha256: chunk.contentSha256,
          tokenCount: chunk.tokenCount,
          pageNumber: chunk.pageNumber,
          embedding: chunk.embedding,
          metadata: {},
        })),
      )
    }

    await tx
      .update(botSource)
      .set({
        status: 'ready',
        statusMessage: 'Pronto para uso',
        pageCount: input.pageCount,
        chunkCount: input.chunks.length,
        processedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.processingVersion, input.expectedVersion),
        ),
      )
  })
}
