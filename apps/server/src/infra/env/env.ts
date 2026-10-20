import z from 'zod'
import { backendInfrastructureEnvSchema } from '@training-ia/contracts/env'

export const envSchema = backendInfrastructureEnvSchema.extend({
	HOST: z.string().default('0.0.0.0'),
	PORT: z.coerce.number().int().positive().default(3333),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url(),
	CLIENT_ORIGIN: z.url(),
	OPENROUTER_CHAT_MODEL: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>
