import type { FastifyInstance } from 'fastify'

import { BotSourcesController } from '../controllers/bot-sources.controller.js'

export async function botSourcesRoutes(app: FastifyInstance) {
  const controller = new BotSourcesController()
  const base = '/api/organizations/:organizationId/bots/:botId/sources'

  app.get(base, (request, reply) =>
    controller.list(request as Parameters<typeof controller.list>[0], reply),
  )
  app.post(`${base}/presign`, (request, reply) =>
    controller.presign(
      request as Parameters<typeof controller.presign>[0],
      reply,
    ),
  )
  app.post(`${base}/:sourceId/complete`, (request, reply) =>
    controller.complete(
      request as Parameters<typeof controller.complete>[0],
      reply,
    ),
  )
  app.post(`${base}/:sourceId/retry`, (request, reply) =>
    controller.retry(
      request as Parameters<typeof controller.retry>[0],
      reply,
    ),
  )
  app.delete(`${base}/:sourceId`, (request, reply) =>
    controller.remove(
      request as Parameters<typeof controller.remove>[0],
      reply,
    ),
  )
}
