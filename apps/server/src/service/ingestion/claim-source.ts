import { BotSourceRepository } from '../../repositories/bot-source.repository.js'
import { IngestionError } from '../../lib/errors/ingestion-error.js'
import type { BotSourceRow } from '../../repositories/bot-source.repository.js'

export type ClaimResult =
  | { kind: 'ready'; source: BotSourceRow }
  | { kind: 'claimed'; source: BotSourceRow }
  | { kind: 'skipped' }

export async function claimSource(input: {
  sourceId: string
  organizationId: string
  botId: string
  repository?: BotSourceRepository
}): Promise<ClaimResult> {
  const repository = input.repository ?? new BotSourceRepository()
  const source = await repository.findById(input)

  if (!source) {
    throw new IngestionError('SOURCE_NOT_FOUND')
  }

  if (source.status === 'ready') {
    return { kind: 'ready', source }
  }

  if (source.status === 'deleting') {
    return { kind: 'skipped' }
  }

  const claimed = await repository.claimProcessing({
    sourceId: input.sourceId,
    organizationId: input.organizationId,
    botId: input.botId,
    statusMessage: 'Baixando arquivo',
  })

  if (!claimed) {
    const current = await repository.findById(input)
    if (current?.status === 'ready') {
      return { kind: 'ready', source: current }
    }
    if (current?.status === 'processing') {
      throw new IngestionError('CLAIM_LOST')
    }
    return { kind: 'skipped' }
  }

  return { kind: 'claimed', source: claimed }
}
