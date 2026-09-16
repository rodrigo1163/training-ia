import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { requireBot, sendBotGuardFailure } from '../http/require-bot.js'
import { sendApiError } from '../http/send-api-error.js'
import { BotSourceRepository } from '../repositories/bot-source.repository.js'
import { BotSourceLifecycleService } from '../service/bot-source-lifecycle.service.js'
import { BotSourceUploadService } from '../service/bot-source-upload.service.js'

type SourceParams = {
  organizationId: string
  botId: string
  sourceId?: string
}

const presignBodySchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.literal('application/pdf'),
  byteSize: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
})

const completeBodySchema = z.object({
  etag: z.string().min(1).max(256),
})

export class BotSourcesController {
  constructor(
    private readonly sources = new BotSourceRepository(),
    private readonly upload = new BotSourceUploadService(),
    private readonly lifecycle = new BotSourceLifecycleService(),
  ) {}

  async list(
    request: FastifyRequest<{ Params: SourceParams }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const items = await this.sources.listByBot({
      organizationId: guard.context.organizationId,
      botId: request.params.botId,
    })

    return reply.send({ items })
  }

  async presign(
    request: FastifyRequest<{ Params: SourceParams; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const parsed = presignBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos.')
    }

    const result = await this.upload.presign({
      organizationId: guard.context.organizationId,
      botId: request.params.botId,
      userId: guard.context.userId,
      ...parsed.data,
    })

    if (!result.ok) {
      const status = result.code === 'DUPLICATE_SOURCE' ? 409 : 400
      return sendApiError(reply, status, result.code, result.message)
    }

    return reply.status(201).send(result)
  }

  async complete(
    request: FastifyRequest<{ Params: SourceParams; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const sourceId = request.params.sourceId
    if (!sourceId) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'sourceId obrigatório.')
    }

    const parsed = completeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos.')
    }

    const result = await this.upload.complete({
      organizationId: guard.context.organizationId,
      botId: request.params.botId,
      sourceId,
      etag: parsed.data.etag,
    })

    if (!result.ok) {
      const status =
        result.code === 'SOURCE_NOT_FOUND'
          ? 404
          : result.code === 'ENQUEUE_FAILED'
            ? 502
            : 400
      return sendApiError(reply, status, result.code, result.message)
    }

    return reply.send({ source: result.source })
  }

  async retry(
    request: FastifyRequest<{ Params: SourceParams }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const sourceId = request.params.sourceId
    if (!sourceId) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'sourceId obrigatório.')
    }

    const result = await this.lifecycle.retry({
      organizationId: guard.context.organizationId,
      botId: request.params.botId,
      sourceId,
    })

    if (!result.ok) {
      const status =
        result.code === 'SOURCE_NOT_FOUND'
          ? 404
          : result.code === 'ENQUEUE_FAILED'
            ? 502
            : 400
      return sendApiError(reply, status, result.code, result.message)
    }

    return reply.send({ source: result.source })
  }

  async remove(
    request: FastifyRequest<{ Params: SourceParams }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const sourceId = request.params.sourceId
    if (!sourceId) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'sourceId obrigatório.')
    }

    const result = await this.lifecycle.remove({
      organizationId: guard.context.organizationId,
      botId: request.params.botId,
      sourceId,
    })

    if (!result.ok) {
      return sendApiError(reply, 404, result.code, result.message)
    }

    return reply.status(202).send({ source: result.source })
  }
}
