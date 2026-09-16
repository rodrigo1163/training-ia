import { and, eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'

import { auth } from '../auth.js'
import { db } from '../db/index.js'
import { member } from '../db/schema.js'
import { sendApiError } from './send-api-error.js'

export type OrganizationContext = {
  userId: string
  organizationId: string
}

export type OrganizationGuardFailure = {
  ok: false
  status: 401 | 403
  error: string
  code: 'UNAUTHORIZED' | 'NO_ACTIVE_ORGANIZATION' | 'FORBIDDEN'
}

export type OrganizationGuardSuccess = {
  ok: true
  context: OrganizationContext
}

export type OrganizationGuardResult =
  | OrganizationGuardSuccess
  | OrganizationGuardFailure

export async function requireOrganization(
  request: FastifyRequest,
): Promise<OrganizationGuardResult> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    }
  }

  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      ok: false,
      status: 403,
      error: 'No active organization',
      code: 'NO_ACTIVE_ORGANIZATION',
    }
  }

  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId),
      ),
    )
    .limit(1)

  if (!membership) {
    return {
      ok: false,
      status: 403,
      error: 'Not a member of the active organization',
      code: 'FORBIDDEN',
    }
  }

  return {
    ok: true,
    context: {
      userId: session.user.id,
      organizationId,
    },
  }
}

export function sendOrganizationGuardFailure(
  reply: FastifyReply,
  failure: OrganizationGuardFailure,
) {
  return sendApiError(reply, failure.status, failure.code, failure.error)
}
