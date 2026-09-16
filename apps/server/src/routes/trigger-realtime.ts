import type { FastifyInstance } from 'fastify'

import { TriggerRealtimeController } from '../controllers/trigger-realtime.controller.js'

export async function triggerRealtimeRoutes(app: FastifyInstance) {
  const controller = new TriggerRealtimeController()

  app.get('/api/trigger/realtime-token', (request, reply) =>
    controller.createToken(
      request as Parameters<typeof controller.createToken>[0],
      reply,
    ),
  )
}
