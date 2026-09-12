import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CLIENT_ORIGIN: z.url(),
})

export const env = envSchema.parse(process.env)
