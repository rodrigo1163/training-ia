import { and, desc, eq, lt, ne, or, sql } from 'drizzle-orm'

import { db as defaultDb } from '../db/index.js'
import {
  DEFAULT_SYSTEM_PROMPT,
  bot,
  type BotStatus,
} from '../db/bot-schema.js'
import { env } from '../env.js'

type DbClient = typeof defaultDb

export type BotRow = typeof bot.$inferSelect

export type CreateBotInput = {
  organizationId: string
  createdByUserId: string
  name: string
  description?: string | null
  systemPrompt?: string
}

export type UpdateBotInput = {
  name?: string
  description?: string | null
  systemPrompt?: string
  status?: Exclude<BotStatus, 'deleting'>
  widgetConfig?: Record<string, unknown>
}

export class BotRepository {
  constructor(private readonly db: DbClient = defaultDb) {}

  async create(input: CreateBotInput): Promise<BotRow> {
    const [row] = await this.db
      .insert(bot)
      .values({
        organizationId: input.organizationId,
        createdByUserId: input.createdByUserId,
        name: input.name,
        description: input.description ?? null,
        systemPrompt: input.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        status: 'active',
        chatModel: env.OPENROUTER_CHAT_MODEL,
        embeddingModel: env.OPENROUTER_EMBEDDING_MODEL,
        embeddingDimensions: env.OPENROUTER_EMBEDDING_DIMENSIONS,
        widgetConfig: {},
      })
      .returning()

    return row
  }

  async findById(input: {
    botId: string
    organizationId: string
  }): Promise<BotRow | undefined> {
    const [row] = await this.db
      .select()
      .from(bot)
      .where(
        and(
          eq(bot.id, input.botId),
          eq(bot.organizationId, input.organizationId),
        ),
      )
      .limit(1)

    return row
  }

  async listByOrganization(input: {
    organizationId: string
    limit: number
    cursor?: string
  }): Promise<{ items: BotRow[]; nextCursor: string | null }> {
    const conditions = [
      eq(bot.organizationId, input.organizationId),
      ne(bot.status, 'deleting'),
    ]

    if (input.cursor) {
      const [createdAtIso, id] = input.cursor.split('|')
      const createdAt = new Date(createdAtIso)

      if (!Number.isNaN(createdAt.getTime()) && id) {
        conditions.push(
          or(
            lt(bot.createdAt, createdAt),
            and(eq(bot.createdAt, createdAt), lt(bot.id, id)),
          )!,
        )
      }
    }

    const items = await this.db
      .select()
      .from(bot)
      .where(and(...conditions))
      .orderBy(desc(bot.createdAt), desc(bot.id))
      .limit(input.limit + 1)

    const hasMore = items.length > input.limit
    const page = hasMore ? items.slice(0, input.limit) : items
    const last = page.at(-1)

    return {
      items: page,
      nextCursor: hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
    }
  }

  async update(input: {
    botId: string
    organizationId: string
    data: UpdateBotInput
  }): Promise<BotRow | undefined> {
    const [row] = await this.db
      .update(bot)
      .set({
        ...input.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bot.id, input.botId),
          eq(bot.organizationId, input.organizationId),
          ne(bot.status, 'deleting'),
        ),
      )
      .returning()

    return row
  }

  async markDeleting(input: {
    botId: string
    organizationId: string
  }): Promise<BotRow | undefined> {
    const [row] = await this.db
      .update(bot)
      .set({
        status: 'deleting',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bot.id, input.botId),
          eq(bot.organizationId, input.organizationId),
          sql`${bot.status} <> 'deleting'`,
        ),
      )
      .returning()

    return row
  }

  async deleteById(input: {
    botId: string
    organizationId: string
  }): Promise<void> {
    await this.db
      .delete(bot)
      .where(
        and(
          eq(bot.id, input.botId),
          eq(bot.organizationId, input.organizationId),
        ),
      )
  }
}
