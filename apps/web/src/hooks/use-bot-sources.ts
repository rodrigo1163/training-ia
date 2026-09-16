import { queryOptions } from '@tanstack/react-query'

import { apiJson } from '@/lib/api-client'

export type BotSourceStatus =
  | 'awaiting_upload'
  | 'queued'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'deleting'

export type BotSource = {
  id: string
  organizationId: string
  botId: string
  uploadedByUserId: string | null
  type: 'pdf'
  status: BotSourceStatus
  statusMessage: string | null
  originalFilename: string
  mimeType: string
  byteSize: number
  r2Etag: string | null
  pageCount: number | null
  chunkCount: number
  processingVersion: number
  errorCode: string | null
  errorMessage: string | null
  triggerRunId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  processedAt: string | null
}

export function botSourcesQueryKey(organizationId: string, botId: string) {
  return ['bot-sources', organizationId, botId] as const
}

export function botSourcesQueryOptions(organizationId: string, botId: string) {
  return queryOptions({
    queryKey: botSourcesQueryKey(organizationId, botId),
    queryFn: async () => {
      const data = await apiJson<{ items: BotSource[] }>(
        `/api/organizations/${organizationId}/bots/${botId}/sources`,
      )
      return data.items
    },
  })
}

export async function retryBotSource(
  organizationId: string,
  botId: string,
  sourceId: string,
) {
  return apiJson<{ source: BotSource }>(
    `/api/organizations/${organizationId}/bots/${botId}/sources/${sourceId}/retry`,
    { method: 'POST' },
  )
}

export async function deleteBotSource(
  organizationId: string,
  botId: string,
  sourceId: string,
) {
  return apiJson<{ source: BotSource }>(
    `/api/organizations/${organizationId}/bots/${botId}/sources/${sourceId}`,
    { method: 'DELETE' },
  )
}
