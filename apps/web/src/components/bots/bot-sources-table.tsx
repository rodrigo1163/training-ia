import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, RotateCcwIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import {
  botSourcesQueryOptions,
  deleteBotSource,
  retryBotSource,
  type BotSource,
} from '@/hooks/use-bot-sources'
import { useBotSourcesRealtime } from '@/hooks/use-bot-sources-realtime'
import { cn } from '@/lib/utils'

const statusProgress: Record<
  Exclude<BotSource['status'], 'failed' | 'deleting'>,
  number
> = {
  awaiting_upload: 0,
  queued: 0,
  processing: 50,
  ready: 100,
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BotSourcesTable({
  organizationId,
  botId,
}: {
  organizationId: string
  botId: string
}) {
  useBotSourcesRealtime(organizationId, botId)
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useQuery(
    botSourcesQueryOptions(organizationId, botId),
  )

  const retryMutation = useMutation({
    mutationFn: (sourceId: string) =>
      retryBotSource(organizationId, botId, sourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: botSourcesQueryOptions(organizationId, botId).queryKey,
      })
    },
    onError: (mutationError) => {
      toast.add({
        title:
          mutationError instanceof Error
            ? mutationError.message
            : 'Não foi possível reprocessar.',
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (sourceId: string) =>
      deleteBotSource(organizationId, botId, sourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: botSourcesQueryOptions(organizationId, botId).queryKey,
      })
      toast.add({ title: 'Fonte removida', type: 'success' })
    },
    onError: (mutationError) => {
      toast.add({
        title:
          mutationError instanceof Error
            ? mutationError.message
            : 'Não foi possível remover.',
        type: 'error',
      })
    },
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando fontes…</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : 'Não foi possível carregar as fontes.'}
      </p>
    )
  }

  const sources = data ?? []

  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma fonte adicionada ainda.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Arquivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Mensagem</TableHead>
          <TableHead>Páginas</TableHead>
          <TableHead>Chunks</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Atualizado</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => {
          const progress =
            source.status === 'failed' || source.status === 'deleting'
              ? null
              : statusProgress[source.status]

          return (
            <TableRow key={source.id}>
              <TableCell className="uppercase">{source.type}</TableCell>
              <TableCell className="max-w-[220px] truncate">
                {source.originalFilename}
              </TableCell>
              <TableCell>
                {source.status === 'failed' ? (
                  <span className="text-sm text-destructive">Falhou</span>
                ) : source.status === 'deleting' ? (
                  <span className="text-sm text-muted-foreground">Removendo</span>
                ) : (
                  <div className="flex w-28 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-500',
                          source.status === 'ready' && 'bg-emerald-500',
                          source.status === 'processing' && 'bg-amber-400',
                          (source.status === 'queued' ||
                            source.status === 'awaiting_upload') &&
                            'bg-foreground/70',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-8 text-right text-xs tabular-nums',
                        source.status === 'ready' && 'text-emerald-600',
                        source.status === 'processing' && 'text-amber-600',
                        (source.status === 'queued' ||
                          source.status === 'awaiting_upload') &&
                          'text-muted-foreground',
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {source.errorMessage ?? source.statusMessage ?? '—'}
              </TableCell>
              <TableCell>{source.pageCount ?? '—'}</TableCell>
              <TableCell>{source.chunkCount}</TableCell>
              <TableCell>{formatBytes(source.byteSize)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(source.updatedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {source.status === 'failed' ? (
                    <Button
                      aria-label="Reprocessar"
                      disabled={retryMutation.isPending}
                      onClick={() => retryMutation.mutate(source.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      {retryMutation.isPending ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <RotateCcwIcon className="size-4" />
                      )}
                    </Button>
                  ) : null}
                  <Button
                    aria-label="Remover"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(source.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
