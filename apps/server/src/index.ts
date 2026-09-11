import { buildServer } from './app.js'
import { env } from './env.js'

const server = buildServer()

server.listen({
  port: env.PORT,
  host: env.HOST
})
