import { logger, task } from '@trigger.dev/sdk'

import { taskDb } from '../db/task-db.js'
import { deleteObject } from '../lib/r2/client.js'
import { BotRepository } from '../repositories/bot.repository.js'
import { BotSourceRepository } from '../repositories/bot-source.repository.js'

export type BotCleanupPayload =
  | {
      scope: 'bot'
      organizationId: string
      botId: string
    }
  | {
      scope: 'source'
      organizationId: string
      botId: string
      sourceId: string
      r2ObjectKey: string
    }

export const botCleanupTask = task({
  id: 'bot-cleanup',
  run: async (payload: BotCleanupPayload) => {
    const sources = new BotSourceRepository(taskDb)
    const bots = new BotRepository(taskDb)

    if (payload.scope === 'source') {
      try {
        await deleteObject(payload.r2ObjectKey)
      } catch (error) {
        logger.warn('Failed to delete R2 object for source', {
          sourceId: payload.sourceId,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }

      await sources.deleteById({
        sourceId: payload.sourceId,
        organizationId: payload.organizationId,
        botId: payload.botId,
      })

      return { ok: true as const, scope: 'source' as const }
    }

    const keys = await sources.listObjectKeysByBot({
      organizationId: payload.organizationId,
      botId: payload.botId,
    })

    for (const key of keys) {
      try {
        await deleteObject(key)
      } catch (error) {
        logger.warn('Failed to delete R2 object for bot', {
          botId: payload.botId,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
    }

    await bots.deleteById({
      botId: payload.botId,
      organizationId: payload.organizationId,
    })

    return { ok: true as const, scope: 'bot' as const, deletedObjects: keys.length }
  },
})
