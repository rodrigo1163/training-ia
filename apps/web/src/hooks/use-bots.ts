import { queryOptions } from '@tanstack/react-query'

import { apiJson } from '@/lib/api-client'

export type Bot = {
  id: string
  organizationId: string
  createdByUserId: string | null
  name: string
  description: string | null
  systemPrompt: string
  status: 'draft' | 'active' | 'archived' | 'deleting'
  chatModel: string
  embeddingModel: string
  embeddingDimensions: number
  widgetConfig: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export function botsQueryKey(organizationId: string) {
  return ['bots', organizationId] as const
}

export function botQueryKey(organizationId: string, botId: string) {
  return ['bots', organizationId, botId] as const
}

export function botsQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: botsQueryKey(organizationId),
    queryFn: async () => {
      const data = await apiJson<{ items: Bot[]; nextCursor: string | null }>(
        `/api/organizations/${organizationId}/bots`,
      )
      return data
    },
  })
}

export function botQueryOptions(organizationId: string, botId: string) {
  return queryOptions({
    queryKey: botQueryKey(organizationId, botId),
    queryFn: async () => {
      const data = await apiJson<{ bot: Bot }>(
        `/api/organizations/${organizationId}/bots/${botId}`,
      )
      return data.bot
    },
  })
}

export async function createBot(
  organizationId: string,
  body: { name: string; description?: string | null; systemPrompt?: string },
) {
  const data = await apiJson<{ bot: Bot }>(
    `/api/organizations/${organizationId}/bots`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return data.bot
}

export async function updateBot(
  organizationId: string,
  botId: string,
  body: {
    name?: string
    description?: string | null
    systemPrompt?: string
    status?: 'draft' | 'active' | 'archived'
  },
) {
  const data = await apiJson<{ bot: Bot }>(
    `/api/organizations/${organizationId}/bots/${botId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return data.bot
}

export async function deleteBot(organizationId: string, botId: string) {
  await apiJson(`/api/organizations/${organizationId}/bots/${botId}`, {
    method: 'DELETE',
  })
}
