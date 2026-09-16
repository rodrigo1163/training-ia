import type { FastifyReply } from 'fastify'
import { randomUUID } from 'node:crypto'

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    requestId: string
  }
}

export function sendApiError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  requestId = randomUUID(),
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      requestId,
    },
  }

  return reply.status(status).send(body)
}
