import type { FastifyInstance } from 'fastify'

import { BotChatController } from '../controllers/bot-chat.controller.js'

export async function botChatRoutes(app: FastifyInstance) {
  const controller = new BotChatController()

  app.post(
    '/api/organizations/:organizationId/bots/:botId/chat',
    (request, reply) =>
      controller.stream(
        request as Parameters<typeof controller.stream>[0],
        reply,
      ),
  )
}
