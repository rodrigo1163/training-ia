import { relations, sql } from 'drizzle-orm'
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'

import { organization, user } from './schema.js'

export type BotStatus = 'draft' | 'active' | 'archived' | 'deleting'

export type BotSourceStatus =
  | 'awaiting_upload'
  | 'queued'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'deleting'

export type BotSourceType = 'pdf'

export const DEFAULT_SYSTEM_PROMPT =
  'Você é um assistente útil. Responda com base na documentação fornecida. Se a informação não estiver no contexto, diga que não encontrou.'

// --- bot ---

export const bot = pgTable(
  'bot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description'),
    systemPrompt: text('system_prompt').notNull().default(DEFAULT_SYSTEM_PROMPT),
    status: text('status').$type<BotStatus>().notNull().default('active'),
    chatModel: text('chat_model').notNull().default('google/gemini-2.5-flash'),
    embeddingModel: text('embedding_model')
      .notNull()
      .default('openai/text-embedding-3-small'),
    embeddingDimensions: integer('embedding_dimensions').notNull().default(1536),
    widgetConfig: jsonb('widget_config')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('bot_organization_created_id_idx').on(
      table.organizationId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index('bot_organization_status_idx').on(table.organizationId, table.status),
    index('bot_created_by_user_id_idx').on(table.createdByUserId),
  ],
)

// --- bot_source ---

export const botSource = pgTable(
  'bot_source',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    botId: uuid('bot_id')
      .notNull()
      .references(() => bot.id, { onDelete: 'cascade' }),
    uploadedByUserId: text('uploaded_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    type: text('type').$type<BotSourceType>().notNull().default('pdf'),
    status: text('status').$type<BotSourceStatus>().notNull(),
    statusMessage: text('status_message'),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    sha256: text('sha256').notNull(),
    r2ObjectKey: text('r2_object_key').notNull(),
    r2Etag: text('r2_etag'),
    pageCount: integer('page_count'),
    chunkCount: integer('chunk_count').notNull().default(0),
    processingVersion: integer('processing_version').notNull().default(1),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    triggerRunId: text('trigger_run_id'),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('bot_source_bot_sha256_uidx').on(table.botId, table.sha256),
    uniqueIndex('bot_source_r2_object_key_uidx').on(table.r2ObjectKey),
    index('bot_source_org_bot_created_idx').on(
      table.organizationId,
      table.botId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index('bot_source_status_pending_idx')
      .on(table.status)
      .where(
        sql`${table.status} IN ('awaiting_upload', 'queued', 'processing', 'deleting')`,
      ),
    index('bot_source_uploaded_by_user_id_idx').on(table.uploadedByUserId),
  ],
)

// --- bot_chunk ---

export const botChunk = pgTable(
  'bot_chunk',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    botId: uuid('bot_id')
      .notNull()
      .references(() => bot.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => botSource.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    contentSha256: text('content_sha256').notNull(),
    tokenCount: integer('token_count'),
    pageNumber: integer('page_number'),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('bot_chunk_source_index_uidx').on(
      table.sourceId,
      table.chunkIndex,
    ),
    index('bot_chunk_org_bot_idx').on(table.organizationId, table.botId),
    index('bot_chunk_source_id_idx').on(table.sourceId),
    index('bot_chunk_embedding_hnsw_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  ],
)

// --- relations ---

export const botRelations = relations(bot, ({ one, many }) => ({
  organization: one(organization, {
    fields: [bot.organizationId],
    references: [organization.id],
  }),
  creator: one(user, {
    fields: [bot.createdByUserId],
    references: [user.id],
  }),
  sources: many(botSource),
  chunks: many(botChunk),
}))

export const botSourceRelations = relations(botSource, ({ one, many }) => ({
  organization: one(organization, {
    fields: [botSource.organizationId],
    references: [organization.id],
  }),
  bot: one(bot, {
    fields: [botSource.botId],
    references: [bot.id],
  }),
  uploader: one(user, {
    fields: [botSource.uploadedByUserId],
    references: [user.id],
  }),
  chunks: many(botChunk),
}))

export const botChunkRelations = relations(botChunk, ({ one }) => ({
  organization: one(organization, {
    fields: [botChunk.organizationId],
    references: [organization.id],
  }),
  bot: one(bot, {
    fields: [botChunk.botId],
    references: [bot.id],
  }),
  source: one(botSource, {
    fields: [botChunk.sourceId],
    references: [botSource.id],
  }),
}))
