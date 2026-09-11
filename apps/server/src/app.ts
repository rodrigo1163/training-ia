import fastify from 'fastify'

export function buildServer() {
  const app = fastify({
    logger: true,
  })

  app.get('/health', async () => {
    return {
      status: 'ok',
    }
  })

  return app
}
