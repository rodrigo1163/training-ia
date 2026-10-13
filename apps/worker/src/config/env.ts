import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  REDIS_URL: z.string().url().startsWith('redis://'),
  RABBITMQ_URL: z.string().url().startsWith('amqp://'),
})

export type WorkerEnv = z.infer<typeof envSchema>

export function loadEnv(): WorkerEnv {
  return envSchema.parse(process.env)
}
