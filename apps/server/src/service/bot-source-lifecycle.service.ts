import { tasks } from '@trigger.dev/sdk'

import { BotSourceRepository } from '../repositories/bot-source.repository.js'
import type { botCleanupTask } from '../trigger/bot-cleanup.task.js'
import type { pdfIngestTask } from '../trigger/pdf-ingest.task.js'

export class BotSourceLifecycleService {
  constructor(private readonly sources = new BotSourceRepository()) {}

  async retry(input: {
    organizationId: string
    botId: string
    sourceId: string
  }) {
    const source = await this.sources.findById(input)

    if (!source || source.status === 'deleting') {
      return {
        ok: false as const,
        code: 'SOURCE_NOT_FOUND' as const,
        message: 'Fonte não encontrada.',
      }
    }

    if (source.status !== 'failed') {
      return {
        ok: false as const,
        code: 'INVALID_SOURCE_STATE' as const,
        message: 'Somente fontes com falha podem ser reprocessadas.',
      }
    }

    const queued = await this.sources.markForRetry(input)

    if (!queued) {
      return {
        ok: false as const,
        code: 'INVALID_SOURCE_STATE' as const,
        message: 'Somente fontes com falha podem ser reprocessadas.',
      }
    }

    try {
      const handle = await tasks.trigger<typeof pdfIngestTask>(
        'pdf-ingest',
        {
          sourceId: queued.id,
          organizationId: queued.organizationId,
          botId: queued.botId,
          processingVersion: queued.processingVersion,
        },
        {
          idempotencyKey: `${queued.id}:v${queued.processingVersion}`,
          tags: [
            `org_${queued.organizationId}`,
            `bot_${queued.botId}`,
            `source_${queued.id}`,
          ],
        },
      )

      await this.sources.attachRunId({
        sourceId: queued.id,
        organizationId: queued.organizationId,
        botId: queued.botId,
        triggerRunId: handle.id,
      })

      return {
        ok: true as const,
        source: { ...queued, triggerRunId: handle.id },
      }
    } catch {
      await this.sources.markFailed({
        sourceId: queued.id,
        organizationId: queued.organizationId,
        botId: queued.botId,
        statusMessage: 'Falha ao enfileirar o reprocessamento',
        errorCode: 'ENQUEUE_FAILED',
      })

      return {
        ok: false as const,
        code: 'ENQUEUE_FAILED' as const,
        message: 'Não foi possível enfileirar o reprocessamento.',
      }
    }
  }

  async remove(input: {
    organizationId: string
    botId: string
    sourceId: string
  }) {
    const source = await this.sources.findById(input)

    if (!source) {
      return {
        ok: false as const,
        code: 'SOURCE_NOT_FOUND' as const,
        message: 'Fonte não encontrada.',
      }
    }

    if (source.status === 'deleting') {
      return { ok: true as const, alreadyDeleting: true as const, source }
    }

    const deleting = await this.sources.markDeleting(input)

    if (!deleting) {
      return {
        ok: false as const,
        code: 'SOURCE_NOT_FOUND' as const,
        message: 'Fonte não encontrada.',
      }
    }

    await tasks.trigger<typeof botCleanupTask>(
      'bot-cleanup',
      {
        organizationId: input.organizationId,
        botId: input.botId,
        sourceId: input.sourceId,
        scope: 'source',
        r2ObjectKey: deleting.r2ObjectKey,
      },
      {
        idempotencyKey: `source-cleanup-${input.sourceId}`,
        tags: [
          `org_${input.organizationId}`,
          `bot_${input.botId}`,
          `source_${input.sourceId}`,
        ],
      },
    )

    return { ok: true as const, alreadyDeleting: false as const, source: deleting }
  }
}
