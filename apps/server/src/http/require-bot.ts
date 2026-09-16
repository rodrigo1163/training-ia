import { and, eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { db } from '../db/index.js'
import { bot, type BotStatus } from '../db/bot-schema.js'
import {
  requireOrganization,
  sendOrganizationGuardFailure,
  type OrganizationContext,
} from './require-organization.js'
import { sendApiError } from './send-api-error.js'

export type BotRow = typeof bot.$inferSelect

export type BotGuardSuccess = {
  ok: true
  context: OrganizationContext & { bot: BotRow }
}

export type BotGuardFailure = {
  ok: false
  status: 401 | 403 | 404
  code: string
  message: string
}

export type BotGuardResult = BotGuardSuccess | BotGuardFailure

export async function requireBot(
  request: FastifyRequest,
  botId: string,
  options?: { allowDeleting?: boolean },
): Promise<BotGuardResult> {
  const orgGuard = await requireOrganization(request)

  if (!orgGuard.ok) {
    return {
      ok: false,
      status: orgGuard.status,
      code: orgGuard.code,
      message: orgGuard.error,
    }
  }

  const [row] = await db
    .select()
    .from(bot)
    .where(
      and(
        eq(bot.id, botId),
        eq(bot.organizationId, orgGuard.context.organizationId),
      ),
    )
    .limit(1)

  if (!row) {
    return {
      ok: false,
      status: 404,
      code: 'BOT_NOT_FOUND',
      message: 'Bot não encontrado.',
    }
  }

  if (!options?.allowDeleting && row.status === ('deleting' as BotStatus)) {
    return {
      ok: false,
      status: 404,
      code: 'BOT_NOT_FOUND',
      message: 'Bot não encontrado.',
    }
  }

  return {
    ok: true,
    context: {
      ...orgGuard.context,
      bot: row,
    },
  }
}

export function sendBotGuardFailure(
  reply: FastifyReply,
  failure: BotGuardFailure,
) {
  if (failure.status === 401 || failure.status === 403) {
    return sendOrganizationGuardFailure(reply, {
      ok: false,
      status: failure.status,
      error: failure.message,
      code: failure.code as 'UNAUTHORIZED' | 'NO_ACTIVE_ORGANIZATION' | 'FORBIDDEN',
    })
  }

  return sendApiError(reply, failure.status, failure.code, failure.message)
}
