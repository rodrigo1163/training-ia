import type { FastifyInstance } from 'fastify'

import { BotsController } from '../controllers/bots.controller.js'

export async function botsRoutes(app: FastifyInstance) {
  const controller = new BotsController()

  app.post('/api/organizations/:organizationId/bots', (request, reply) =>
    controller.create(
      request as Parameters<typeof controller.create>[0],
      reply,
    ),
  )
  app.get('/api/organizations/:organizationId/bots', (request, reply) =>
    controller.list(request as Parameters<typeof controller.list>[0], reply),
  )
  app.get('/api/organizations/:organizationId/bots/:botId', (request, reply) =>
    controller.get(request as Parameters<typeof controller.get>[0], reply),
  )
  app.patch(
    '/api/organizations/:organizationId/bots/:botId',
    (request, reply) =>
      controller.update(
        request as Parameters<typeof controller.update>[0],
        reply,
      ),
  )
  app.delete(
    '/api/organizations/:organizationId/bots/:botId',
    (request, reply) =>
      controller.remove(
        request as Parameters<typeof controller.remove>[0],
        reply,
      ),
  )
}
