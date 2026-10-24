import z from 'zod'

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	VITE_API_URL: z.url().default('http://localhost:3333'),
	VITE_WIDGET_SCRIPT_URL: z.url().default('http://localhost:5174/src/embed.tsx'),
})

export const env = envSchema.parse(import.meta)

export type Env = z.infer<typeof envSchema>
