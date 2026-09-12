import cors from '@fastify/cors'
import { fromNodeHeaders } from 'better-auth/node'
import fastify from 'fastify'

import { auth } from './auth.js'
import { pool } from './db/index.js'
import { env } from './env.js'

export function buildServer() {
  const app = fastify({
    logger: true,
  })

  app.register(cors, {
    origin(origin, callback) {
      callback(null, origin === undefined || origin === env.CLIENT_ORIGIN)
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        const url = new URL(request.url, env.BETTER_AUTH_URL)
        const headers = fromNodeHeaders(request.headers)
        const body =
          request.body === undefined
            ? undefined
            : typeof request.body === 'string'
              ? request.body
              : JSON.stringify(request.body)

        const response = await auth.handler(
          new Request(url, {
            method: request.method,
            headers,
            body,
          }),
        )

        response.headers.forEach((value, key) => {
          if (key !== 'set-cookie') {
            reply.header(key, value)
          }
        })

        const cookies = response.headers.getSetCookie()
        if (cookies.length > 0) {
          reply.header('set-cookie', cookies)
        }

        reply.status(response.status)
        return reply.send(response.body ? await response.text() : null)
      } catch (error) {
        request.log.error({ error }, 'Better Auth request failed')
        return reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        })
      }
    },
  })

  app.get('/health', async () => {
    return {
      status: 'ok',
    }
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })

  return app
}
