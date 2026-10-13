import z from 'zod'

export const envSchema = z.object({
	HOST: z.string().default('0.0.0.0'),
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.url().startsWith('postgresql://'),
	REDIS_URL: z.url().startsWith('redis://'),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url(),
	CLIENT_ORIGIN: z.url(),
	RABBITMQ_URL: z.string().url().startsWith('amqp://'),
	CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
	AWS_BUCKET_NAME: z.string().min(1),
	AWS_ACCESS_KEY_ID: z.string().min(1),
	AWS_SECRET_ACCESS_KEY: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>
