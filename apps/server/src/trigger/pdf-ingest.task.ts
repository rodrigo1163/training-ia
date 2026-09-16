import {
  AbortTaskRunError,
  logger,
  metadata,
  task,
} from '@trigger.dev/sdk'

import { taskDb } from '../db/task-db.js'
import {
  IngestionError,
  isPermanentIngestionError,
} from '../lib/errors/ingestion-error.js'
import { BotSourceRepository } from '../repositories/bot-source.repository.js'
import { claimSource } from '../service/ingestion/claim-source.js'
import { buildChunks } from '../service/ingestion/build-chunks.js'
import {
  downloadSourceToTemp,
  removeTempFile,
} from '../service/ingestion/download-source.js'
import { embedChunks } from '../service/ingestion/embed-chunks.js'
import { extractPages } from '../service/ingestion/extract-pages.js'
import { publishChunks } from '../service/ingestion/publish-chunks.js'

export type PdfIngestPayload = {
  sourceId: string
  organizationId: string
  botId: string
  processingVersion: number
}

export const pdfIngestTask = task({
  id: 'pdf-ingest',
  run: async (payload: PdfIngestPayload) => {
    const repository = new BotSourceRepository(taskDb)
    let tempFilePath: string | undefined

    try {
      const claim = await claimSource({
        ...payload,
        repository,
      })

      if (claim.kind === 'ready') {
        logger.info('PDF ingest skipped: already ready', {
          sourceId: payload.sourceId,
        })
        return { ok: true as const, skipped: true as const }
      }

      if (claim.kind === 'skipped') {
        return { ok: true as const, skipped: true as const }
      }

      const source = claim.source
      metadata.set('statusMessage', 'Baixando arquivo')

      tempFilePath = await downloadSourceToTemp({
        r2ObjectKey: source.r2ObjectKey,
        sourceId: source.id,
      })

      metadata.set('statusMessage', 'Extraindo texto')
      await repository.updateStatusMessage({
        sourceId: source.id,
        organizationId: source.organizationId,
        botId: source.botId,
        status: 'processing',
        statusMessage: 'Extraindo texto',
      })

      const pages = await extractPages(tempFilePath)

      metadata.set('statusMessage', 'Gerando fragmentos')
      await repository.updateStatusMessage({
        sourceId: source.id,
        organizationId: source.organizationId,
        botId: source.botId,
        status: 'processing',
        statusMessage: 'Gerando fragmentos',
      })

      const chunks = await buildChunks(pages)

      metadata.set('statusMessage', 'Gerando embeddings')
      await repository.updateStatusMessage({
        sourceId: source.id,
        organizationId: source.organizationId,
        botId: source.botId,
        status: 'processing',
        statusMessage: 'Gerando embeddings',
      })

      const embedded = await embedChunks(chunks)

      metadata.set('statusMessage', 'Publicando resultados')
      await publishChunks({
        sourceId: source.id,
        organizationId: source.organizationId,
        botId: source.botId,
        expectedVersion: payload.processingVersion || source.processingVersion,
        pageCount: pages.length,
        chunks: embedded,
      })

      metadata.set('statusMessage', 'Pronto para uso')
      logger.info('PDF ingest completed', {
        sourceId: source.id,
        pageCount: pages.length,
        chunkCount: embedded.length,
      })

      return {
        ok: true as const,
        skipped: false as const,
        pageCount: pages.length,
        chunkCount: embedded.length,
      }
    } catch (error) {
      const ingestionError =
        error instanceof IngestionError
          ? error
          : new IngestionError('R2_DOWNLOAD_FAILED', error)

      if (isPermanentIngestionError(ingestionError) || error instanceof IngestionError) {
        await repository.markFailed({
          sourceId: payload.sourceId,
          organizationId: payload.organizationId,
          botId: payload.botId,
          statusMessage: ingestionError.publicMessage,
          errorCode: ingestionError.code,
          errorMessage: ingestionError.publicMessage,
        })
        metadata.set('statusMessage', ingestionError.publicMessage)

        if (!ingestionError.retryable) {
          throw new AbortTaskRunError(ingestionError.code)
        }
      }

      throw error
    } finally {
      if (tempFilePath) {
        await removeTempFile(tempFilePath)
      }
    }
  },
})
