import { auth as triggerAuth } from '@trigger.dev/sdk'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { requireBot, sendBotGuardFailure } from '../http/require-bot.js'
import { sendApiError } from '../http/send-api-error.js'

const querySchema = z.object({
  botId: z.string().uuid(),
})

export class TriggerRealtimeController {
  async createToken(
    request: FastifyRequest<{ Querystring: unknown }>,
    reply: FastifyReply,
  ) {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'botId obrigatório.')
    }

    const guard = await requireBot(request, parsed.data.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    const tag = `bot_${guard.context.bot.id}`
    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          tags: [tag],
        },
      },
      expirationTime: '1h',
    })

    return reply.send({
      ok: true as const,
      token,
      tag,
    })
  }
}
