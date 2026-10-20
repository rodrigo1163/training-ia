import { z } from 'zod'

export const backendInfrastructureEnvSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  REDIS_URL: z.string().url().startsWith('redis://'),
  RABBITMQ_URL: z.string().url().startsWith('amqp://'),
  OPENROUTER_API_KEY: z.string().min(1),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  AWS_BUCKET_NAME: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
})

export type BackendInfrastructureEnv = z.infer<
  typeof backendInfrastructureEnvSchema
>
