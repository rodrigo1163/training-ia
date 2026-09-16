import { tasks } from '@trigger.dev/sdk'

import {
  BotRepository,
  type CreateBotInput,
  type UpdateBotInput,
} from '../repositories/bot.repository.js'
import type { botCleanupTask } from '../trigger/bot-cleanup.task.js'

export class BotService {
  constructor(private readonly bots = new BotRepository()) {}

  create(input: CreateBotInput) {
    return this.bots.create(input)
  }

  list(input: { organizationId: string; limit: number; cursor?: string }) {
    return this.bots.listByOrganization(input)
  }

  get(input: { botId: string; organizationId: string }) {
    return this.bots.findById(input)
  }

  update(input: {
    botId: string
    organizationId: string
    data: UpdateBotInput
  }) {
    return this.bots.update(input)
  }

  async delete(input: { botId: string; organizationId: string }) {
    const existing = await this.bots.findById(input)

    if (!existing) {
      return { ok: false as const, code: 'BOT_NOT_FOUND' as const }
    }

    if (existing.status === 'deleting') {
      return { ok: true as const, alreadyDeleting: true as const, bot: existing }
    }

    const bot = await this.bots.markDeleting(input)

    if (!bot) {
      return { ok: false as const, code: 'BOT_NOT_FOUND' as const }
    }

    await tasks.trigger<typeof botCleanupTask>(
      'bot-cleanup',
      {
        organizationId: input.organizationId,
        botId: input.botId,
        scope: 'bot',
      },
      {
        idempotencyKey: `bot-cleanup-${input.botId}`,
        tags: [`org_${input.organizationId}`, `bot_${input.botId}`],
      },
    )

    return { ok: true as const, alreadyDeleting: false as const, bot }
  }
}
