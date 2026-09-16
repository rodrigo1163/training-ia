import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { botSourcesQueryKey } from '@/hooks/use-bot-sources'
import { apiJson } from '@/lib/api-client'
import { sha256Hex } from '@/lib/sha256'

export type UploadItemStatus =
  | 'hashing'
  | 'presigning'
  | 'uploading'
  | 'completing'
  | 'done'
  | 'error'

export type UploadItem = {
  id: string
  file: File
  status: UploadItemStatus
  progress: number
  error?: string
  sourceId?: string
}

type PresignResponse = {
  ok: true
  sourceId: string
  uploadUrl: string
  headers: Record<string, string>
  expiresAt: string
}

function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }

    const onAbort = () => {
      xhr.abort()
      reject(new Error('Upload cancelado.'))
    }

    signal.addEventListener('abort', onAbort, { once: true })

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }
      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      signal.removeEventListener('abort', onAbort)
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag') ?? `"${Date.now()}"`
        resolve(etag)
        return
      }
      reject(new Error(`Falha no upload (${xhr.status}).`))
    }

    xhr.onerror = () => {
      signal.removeEventListener('abort', onAbort)
      reject(new Error('Falha de rede no upload.'))
    }

    xhr.send(file)
  })
}

export function usePdfUpload(organizationId: string, botId: string) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }, [])

  const startUpload = useCallback(
    async (files: File[]) => {
      const nextItems: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'hashing',
        progress: 0,
      }))

      setItems(nextItems)
      setIsUploading(true)
      const abort = new AbortController()
      abortRef.current = abort

      let successCount = 0
      let errorCount = 0

      for (const item of nextItems) {
        if (abort.signal.aborted) {
          break
        }

        try {
          updateItem(item.id, { status: 'hashing', progress: 0 })
          const sha256 = await sha256Hex(item.file)

          updateItem(item.id, { status: 'presigning' })
          const presign = await apiJson<PresignResponse>(
            `/api/organizations/${organizationId}/bots/${botId}/sources/presign`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: item.file.name,
                mimeType: 'application/pdf',
                byteSize: item.file.size,
                sha256,
              }),
              signal: abort.signal,
            },
          )

          updateItem(item.id, {
            status: 'uploading',
            sourceId: presign.sourceId,
            progress: 0,
          })

          const etag = await putWithProgress(
            presign.uploadUrl,
            item.file,
            presign.headers,
            (progress) => updateItem(item.id, { progress }),
            abort.signal,
          )

          updateItem(item.id, { status: 'completing', progress: 100 })
          await apiJson(
            `/api/organizations/${organizationId}/bots/${botId}/sources/${presign.sourceId}/complete`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ etag }),
              signal: abort.signal,
            },
          )

          updateItem(item.id, { status: 'done', progress: 100 })
          successCount += 1
          await queryClient.invalidateQueries({
            queryKey: botSourcesQueryKey(organizationId, botId),
          })
        } catch (error) {
          errorCount += 1
          if (abort.signal.aborted) {
            updateItem(item.id, {
              status: 'error',
              error: 'Upload cancelado.',
            })
            break
          }

          updateItem(item.id, {
            status: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Não foi possível enviar o arquivo.',
          })
        }
      }

      setIsUploading(false)
      abortRef.current = null
      return { successCount, errorCount }
    },
    [botId, organizationId, queryClient, updateItem],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  return {
    items,
    isUploading,
    startUpload,
    cancel,
    clear,
  }
}
