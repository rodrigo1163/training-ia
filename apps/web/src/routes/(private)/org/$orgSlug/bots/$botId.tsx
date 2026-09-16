import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { BotBehaviorForm } from '@/components/bots/bot-behavior-form'
import { BotPlayground } from '@/components/bots/bot-playground'
import { BotSourcesTable } from '@/components/bots/bot-sources-table'
import { PdfFileUpload } from '@/components/bots/pdf-file-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { botQueryOptions } from '@/hooks/use-bots'

export const Route = createFileRoute('/(private)/org/$orgSlug/bots/$botId')({
  head: () => ({ meta: [{ title: 'Bot | Training IA' }] }),
  component: BotDetailPage,
})

function BotDetailPage() {
  const { orgSlug, botId } = Route.useParams()
  const { activeOrganization } = Route.useRouteContext()
  const { data: bot, isLoading, isError, error } = useQuery(
    botQueryOptions(activeOrganization.id, botId),
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">Carregando bot…</p>
      </div>
    )
  }

  if (isError || !bot) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Bot não encontrado.'}
        </p>
        <Link
          className="text-sm underline"
          params={{ orgSlug }}
          to="/org/$orgSlug/bots"
        >
          Voltar para a listagem
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-medium">{bot.name}</h1>
        {bot.description ? (
          <p className="text-sm text-muted-foreground">{bot.description}</p>
        ) : null}
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
          <TabsTrigger value="testar">Testar</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 space-y-4" value="dados">
          <PdfFileUpload
            botId={bot.id}
            organizationId={activeOrganization.id}
          />
          <BotSourcesTable
            botId={bot.id}
            organizationId={activeOrganization.id}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="comportamento">
          <BotBehaviorForm
            bot={bot}
            organizationId={activeOrganization.id}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="testar">
          <BotPlayground
            botId={bot.id}
            organizationId={activeOrganization.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
