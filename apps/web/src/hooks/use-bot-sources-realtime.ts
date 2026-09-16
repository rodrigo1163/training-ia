import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeRunsWithTag } from '@trigger.dev/react-hooks'

import { apiJson } from '@/lib/api-client'
import { botSourcesQueryKey } from '@/hooks/use-bot-sources'

type RealtimeTokenResponse = {
  ok: true
  token: string
  tag: string
}

export function useBotSourcesRealtime(organizationId: string, botId: string) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const lastSignatureRef = useRef('')

  async function refreshAccessToken() {
    const data = await apiJson<RealtimeTokenResponse>(
      `/api/trigger/realtime-token?botId=${botId}`,
    )
    setToken(data.token)
    setTag(data.tag)
    return data.token
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const data = await apiJson<RealtimeTokenResponse>(
          `/api/trigger/realtime-token?botId=${botId}`,
        )
        if (!cancelled) {
          setToken(data.token)
          setTag(data.tag)
        }
      } catch {
        // Realtime é best-effort; a listagem ainda funciona via query.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [botId])

  const { runs } = useRealtimeRunsWithTag(tag ?? `bot_${botId}`, {
    accessToken: token ?? undefined,
    enabled: Boolean(token && tag),
    skipColumns: ['payload', 'output'],
    refreshAccessToken,
  })

  useEffect(() => {
    if (!runs || runs.length === 0) {
      return
    }

    const signature = runs
      .map((run) => `${run.id}:${run.status}:${run.updatedAt?.toString() ?? ''}`)
      .join('|')

    if (signature === lastSignatureRef.current) {
      return
    }

    lastSignatureRef.current = signature
    void queryClient.invalidateQueries({
      queryKey: botSourcesQueryKey(organizationId, botId),
    })
  }, [botId, organizationId, queryClient, runs])
}
