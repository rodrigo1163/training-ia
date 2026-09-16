import { randomUUID } from 'node:crypto'

import { tasks } from '@trigger.dev/sdk'

import { INGESTION_CONFIG } from '../config/ingestion.js'
import { env } from '../env.js'
import { headObject, presignPut } from '../lib/r2/client.js'
import { buildSourceObjectKey } from '../lib/r2/object-key.js'
import { BotSourceRepository } from '../repositories/bot-source.repository.js'
import type { pdfIngestTask } from '../trigger/pdf-ingest.task.js'

export type PresignInput = {
  organizationId: string
  botId: string
  userId: string
  filename: string
  mimeType: string
  byteSize: number
  sha256: string
}

export class BotSourceUploadService {
  constructor(private readonly sources = new BotSourceRepository()) {}

  async presign(input: PresignInput) {
    if (input.mimeType !== 'application/pdf') {
      return {
        ok: false as const,
        code: 'INVALID_FILE_TYPE' as const,
        message: 'Apenas arquivos PDF são aceitos.',
      }
    }

    if (!input.filename.toLowerCase().endsWith('.pdf')) {
      return {
        ok: false as const,
        code: 'INVALID_FILE_TYPE' as const,
        message: 'Apenas arquivos PDF são aceitos.',
      }
    }

    if (input.byteSize <= 0 || input.byteSize > INGESTION_CONFIG.maxPdfBytes) {
      return {
        ok: false as const,
        code: 'FILE_TOO_LARGE' as const,
        message: 'Arquivo excede o tamanho máximo permitido.',
      }
    }

    if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
      return {
        ok: false as const,
        code: 'INVALID_SHA256' as const,
        message: 'Hash SHA-256 inválido.',
      }
    }

    const duplicate = await this.sources.findBySha256({
      botId: input.botId,
      sha256: input.sha256.toLowerCase(),
    })

    if (duplicate) {
      return {
        ok: false as const,
        code: 'DUPLICATE_SOURCE' as const,
        message: 'Este PDF já foi adicionado a este bot.',
      }
    }

    const sourceId = randomUUID()
    const r2ObjectKey = buildSourceObjectKey({
      environment: env.APP_ENVIRONMENT,
      organizationId: input.organizationId,
      botId: input.botId,
      sourceId,
    })

    const source = await this.sources.createAwaitingUpload({
      id: sourceId,
      organizationId: input.organizationId,
      botId: input.botId,
      uploadedByUserId: input.userId,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      sha256: input.sha256.toLowerCase(),
      r2ObjectKey,
    })

    const uploadUrl = await presignPut({
      key: r2ObjectKey,
      contentType: 'application/pdf',
    })

    const expiresAt = new Date(
      Date.now() + env.R2_PRESIGNED_URL_TTL_SECONDS * 1000,
    ).toISOString()

    return {
      ok: true as const,
      sourceId: source.id,
      uploadUrl,
      headers: {
        'Content-Type': 'application/pdf',
      },
      expiresAt,
    }
  }

  async complete(input: {
    organizationId: string
    botId: string
    sourceId: string
    etag: string
  }) {
    const source = await this.sources.findById(input)

    if (!source || source.status === 'deleting') {
      return {
        ok: false as const,
        code: 'SOURCE_NOT_FOUND' as const,
        message: 'Fonte não encontrada.',
      }
    }

    if (source.status === 'queued' || source.status === 'processing' || source.status === 'ready') {
      return {
        ok: true as const,
        source,
        alreadyCompleted: true as const,
      }
    }

    if (source.status !== 'awaiting_upload') {
      return {
        ok: false as const,
        code: 'INVALID_SOURCE_STATE' as const,
        message: 'A fonte não está aguardando upload.',
      }
    }

    const head = await headObject(source.r2ObjectKey)

    if (head.ContentLength !== source.byteSize) {
      return {
        ok: false as const,
        code: 'OBJECT_SIZE_MISMATCH' as const,
        message: 'O arquivo enviado não corresponde ao tamanho esperado.',
      }
    }

    if (head.ContentType && head.ContentType !== 'application/pdf') {
      return {
        ok: false as const,
        code: 'OBJECT_TYPE_MISMATCH' as const,
        message: 'O arquivo enviado não é um PDF válido.',
      }
    }

    const etag = input.etag.replaceAll('"', '')
    const queued = await this.sources.markQueued({
      ...input,
      r2Etag: etag,
    })

    if (!queued) {
      const current = await this.sources.findById(input)
      if (current && current.status !== 'awaiting_upload') {
        return {
          ok: true as const,
          source: current,
          alreadyCompleted: true as const,
        }
      }

      return {
        ok: false as const,
        code: 'INVALID_SOURCE_STATE' as const,
        message: 'A fonte não está aguardando upload.',
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
          idempotencyKey: queued.id,
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
        alreadyCompleted: false as const,
      }
    } catch {
      await this.sources.markFailed({
        sourceId: queued.id,
        organizationId: queued.organizationId,
        botId: queued.botId,
        statusMessage: 'Falha ao enfileirar o processamento',
        errorCode: 'ENQUEUE_FAILED',
      })

      return {
        ok: false as const,
        code: 'ENQUEUE_FAILED' as const,
        message: 'Não foi possível enfileirar o processamento.',
      }
    }
  }
}
