import { buildServer } from './app.js'
import { env } from './env.js'

const server = buildServer()

try {
  await server.listen({
    host: env.HOST,
    ipv6Only: false,
    port: env.PORT,
  })
} catch (error) {
  server.log.error(error)
  process.exit(1)
}
