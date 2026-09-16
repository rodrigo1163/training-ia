import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  HOST: z.string().default('::'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CLIENT_ORIGIN: z.url(),
  TRIGGER_SECRET_KEY: z.string().startsWith('tr_'),
  APP_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.url().startsWith('https://'),
  R2_PRESIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_CHAT_MODEL: z.string().default('google/gemini-2.5-flash'),
  OPENROUTER_EMBEDDING_MODEL: z.string().default('openai/text-embedding-3-small'),
  OPENROUTER_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OPENROUTER_APP_URL: z.url().default('http://localhost:3000'),
  OPENROUTER_APP_NAME: z.string().default('Training IA'),
})

export const env = envSchema.parse(process.env)
