import { createFileRoute } from '@tanstack/react-router'

import { BotList } from '@/components/bots/bot-list'

export const Route = createFileRoute('/(private)/org/$orgSlug/bots/')({
  head: () => ({ meta: [{ title: 'Bots | Training IA' }] }),
  component: BotsIndexPage,
})

function BotsIndexPage() {
  const { orgSlug } = Route.useParams()
  const { activeOrganization } = Route.useRouteContext()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <BotList organizationId={activeOrganization.id} orgSlug={orgSlug} />
    </div>
  )
}
