import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { BotCreateDialog } from '@/components/bots/bot-create-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { botsQueryOptions } from '@/hooks/use-bots'

export function BotList({
  organizationId,
  orgSlug,
}: {
  organizationId: string
  orgSlug: string
}) {
  const { data, isLoading, isError, error } = useQuery(
    botsQueryOptions(organizationId),
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : 'Não foi possível carregar os bots.'}
      </p>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Bots</h1>
          <p className="text-sm text-muted-foreground">
            Crie bots e alimente-os com PDFs.
          </p>
        </div>
        <BotCreateDialog organizationId={organizationId} orgSlug={orgSlug} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum bot ainda. Crie o primeiro para começar.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((bot) => (
            <li key={bot.id}>
              <Link
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/40"
                params={{ orgSlug, botId: bot.id }}
                to="/org/$orgSlug/bots/$botId"
              >
                <span className="text-sm font-medium">{bot.name}</span>
                {bot.description ? (
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {bot.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
