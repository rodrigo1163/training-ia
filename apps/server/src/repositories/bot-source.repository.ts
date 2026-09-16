import {
  and,
  desc,
  eq,
  inArray,
  ne,
  sql,
} from 'drizzle-orm'

import { db as defaultDb } from '../db/index.js'
import {
  botSource,
  type BotSourceStatus,
} from '../db/bot-schema.js'

type DbClient = typeof defaultDb

export type BotSourceRow = typeof botSource.$inferSelect

export type PublicBotSource = Omit<BotSourceRow, 'r2ObjectKey' | 'sha256'>

export type CreateAwaitingUploadInput = {
  id?: string
  organizationId: string
  botId: string
  uploadedByUserId: string
  originalFilename: string
  mimeType: string
  byteSize: number
  sha256: string
  r2ObjectKey: string
}

const publicColumns = {
  id: botSource.id,
  organizationId: botSource.organizationId,
  botId: botSource.botId,
  uploadedByUserId: botSource.uploadedByUserId,
  type: botSource.type,
  status: botSource.status,
  statusMessage: botSource.statusMessage,
  originalFilename: botSource.originalFilename,
  mimeType: botSource.mimeType,
  byteSize: botSource.byteSize,
  r2Etag: botSource.r2Etag,
  pageCount: botSource.pageCount,
  chunkCount: botSource.chunkCount,
  processingVersion: botSource.processingVersion,
  errorCode: botSource.errorCode,
  errorMessage: botSource.errorMessage,
  triggerRunId: botSource.triggerRunId,
  metadata: botSource.metadata,
  createdAt: botSource.createdAt,
  updatedAt: botSource.updatedAt,
  processedAt: botSource.processedAt,
}

export class BotSourceRepository {
  constructor(private readonly db: DbClient = defaultDb) {}

  async createAwaitingUpload(
    input: CreateAwaitingUploadInput,
  ): Promise<BotSourceRow> {
    const [row] = await this.db
      .insert(botSource)
      .values({
        id: input.id,
        organizationId: input.organizationId,
        botId: input.botId,
        uploadedByUserId: input.uploadedByUserId,
        type: 'pdf',
        status: 'awaiting_upload',
        statusMessage: 'Aguardando upload',
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        sha256: input.sha256,
        r2ObjectKey: input.r2ObjectKey,
      })
      .returning()

    return row
  }

  async findById(input: {
    sourceId: string
    organizationId: string
    botId: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .select()
      .from(botSource)
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
      .limit(1)

    return row
  }

  async findBySha256(input: {
    botId: string
    sha256: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .select()
      .from(botSource)
      .where(
        and(
          eq(botSource.botId, input.botId),
          eq(botSource.sha256, input.sha256),
          ne(botSource.status, 'deleting'),
        ),
      )
      .limit(1)

    return row
  }

  async listByBot(input: {
    organizationId: string
    botId: string
    limit?: number
  }): Promise<PublicBotSource[]> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)

    return this.db
      .select(publicColumns)
      .from(botSource)
      .where(
        and(
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          ne(botSource.status, 'deleting'),
        ),
      )
      .orderBy(desc(botSource.updatedAt))
      .limit(limit)
  }

  async listObjectKeysByBot(input: {
    organizationId: string
    botId: string
  }): Promise<string[]> {
    const rows = await this.db
      .select({ r2ObjectKey: botSource.r2ObjectKey })
      .from(botSource)
      .where(
        and(
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )

    return rows.map((row) => row.r2ObjectKey)
  }

  async markQueued(input: {
    sourceId: string
    organizationId: string
    botId: string
    r2Etag: string
    statusMessage?: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .update(botSource)
      .set({
        status: 'queued',
        statusMessage: input.statusMessage ?? 'Na fila',
        r2Etag: input.r2Etag,
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          eq(botSource.status, 'awaiting_upload'),
        ),
      )
      .returning()

    return row
  }

  async attachRunId(input: {
    sourceId: string
    organizationId: string
    botId: string
    triggerRunId: string
  }): Promise<void> {
    await this.db
      .update(botSource)
      .set({ triggerRunId: input.triggerRunId })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
  }

  async claimProcessing(input: {
    sourceId: string
    organizationId: string
    botId: string
    statusMessage: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .update(botSource)
      .set({
        status: 'processing',
        statusMessage: input.statusMessage,
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          inArray(botSource.status, ['queued', 'failed']),
        ),
      )
      .returning()

    return row
  }

  async markReady(input: {
    sourceId: string
    organizationId: string
    botId: string
    pageCount: number
    chunkCount: number
    statusMessage: string
    expectedVersion: number
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .update(botSource)
      .set({
        status: 'ready',
        statusMessage: input.statusMessage,
        pageCount: input.pageCount,
        chunkCount: input.chunkCount,
        processedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          eq(botSource.processingVersion, input.expectedVersion),
          eq(botSource.status, 'processing'),
        ),
      )
      .returning()

    return row
  }

  async markFailed(input: {
    sourceId: string
    organizationId: string
    botId: string
    statusMessage: string
    errorCode: string
    errorMessage?: string
  }): Promise<void> {
    await this.db
      .update(botSource)
      .set({
        status: 'failed',
        statusMessage: input.statusMessage,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage ?? input.statusMessage,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
  }

  async markForRetry(input: {
    sourceId: string
    organizationId: string
    botId: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .update(botSource)
      .set({
        status: 'queued',
        statusMessage: 'Na fila',
        processingVersion: sql`${botSource.processingVersion} + 1`,
        errorCode: null,
        errorMessage: null,
        triggerRunId: null,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          eq(botSource.status, 'failed'),
        ),
      )
      .returning()

    return row
  }

  async markDeleting(input: {
    sourceId: string
    organizationId: string
    botId: string
  }): Promise<BotSourceRow | undefined> {
    const [row] = await this.db
      .update(botSource)
      .set({
        status: 'deleting',
        statusMessage: 'Removendo',
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
          ne(botSource.status, 'deleting'),
        ),
      )
      .returning()

    return row
  }

  async deleteById(input: {
    sourceId: string
    organizationId: string
    botId: string
  }): Promise<void> {
    await this.db
      .delete(botSource)
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
  }

  async updateStatusMessage(input: {
    sourceId: string
    organizationId: string
    botId: string
    status: BotSourceStatus
    statusMessage: string
  }): Promise<void> {
    await this.db
      .update(botSource)
      .set({
        status: input.status,
        statusMessage: input.statusMessage,
      })
      .where(
        and(
          eq(botSource.id, input.sourceId),
          eq(botSource.organizationId, input.organizationId),
          eq(botSource.botId, input.botId),
        ),
      )
  }
}
