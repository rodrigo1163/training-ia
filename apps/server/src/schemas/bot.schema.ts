import { z } from 'zod'

export const createBotBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  systemPrompt: z.string().trim().min(1).max(8000).optional(),
})

export const updateBotBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    systemPrompt: z.string().trim().min(1).max(8000).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    widgetConfig: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export const listBotsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

export type CreateBotBody = z.infer<typeof createBotBodySchema>
export type UpdateBotBody = z.infer<typeof updateBotBodySchema>
