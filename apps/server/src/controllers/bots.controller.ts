import type { FastifyReply, FastifyRequest } from 'fastify'

import {
  requireOrganization,
  sendOrganizationGuardFailure,
} from '../http/require-organization.js'
import { requireBot, sendBotGuardFailure } from '../http/require-bot.js'
import { sendApiError } from '../http/send-api-error.js'
import {
  createBotBodySchema,
  listBotsQuerySchema,
  updateBotBodySchema,
} from '../schemas/bot.schema.js'
import { BotService } from '../service/bot.service.js'

type OrgParams = { organizationId: string }
type BotParams = { organizationId: string; botId: string }

export class BotsController {
  constructor(private readonly bots = new BotService()) {}

  async create(
    request: FastifyRequest<{ Params: OrgParams; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireOrganization(request)
    if (!guard.ok) {
      return sendOrganizationGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const parsed = createBotBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos.')
    }

    const bot = await this.bots.create({
      organizationId: guard.context.organizationId,
      createdByUserId: guard.context.userId,
      ...parsed.data,
    })

    return reply.status(201).send({ bot })
  }

  async list(
    request: FastifyRequest<{ Params: OrgParams; Querystring: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireOrganization(request)
    if (!guard.ok) {
      return sendOrganizationGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const parsed = listBotsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Query inválida.')
    }

    const result = await this.bots.list({
      organizationId: guard.context.organizationId,
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
    })

    return reply.send(result)
  }

  async get(
    request: FastifyRequest<{ Params: BotParams }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    return reply.send({ bot: guard.context.bot })
  }

  async update(
    request: FastifyRequest<{ Params: BotParams; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const parsed = updateBotBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos.')
    }

    const bot = await this.bots.update({
      botId: request.params.botId,
      organizationId: guard.context.organizationId,
      data: parsed.data,
    })

    if (!bot) {
      return sendApiError(reply, 404, 'BOT_NOT_FOUND', 'Bot não encontrado.')
    }

    return reply.send({ bot })
  }

  async remove(
    request: FastifyRequest<{ Params: BotParams }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId, {
      allowDeleting: true,
    })
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const result = await this.bots.delete({
      botId: request.params.botId,
      organizationId: guard.context.organizationId,
    })

    if (!result.ok) {
      return sendApiError(reply, 404, 'BOT_NOT_FOUND', 'Bot não encontrado.')
    }

    return reply.status(202).send({ bot: result.bot })
  }
}
