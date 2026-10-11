import { createFileRoute } from '@tanstack/react-router'

import { PdfFileUpload } from '@/components/bots/pdf-file-upload'
import { FetchDataTable } from '@/components/bots/fetch-data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/(private)/org/$orgSlug/bots')({
  head: () => ({ meta: [{ title: 'Bots | Training IA' }] }),
  component: BotsPage,
})

function BotsPage() {
  const { orgSlug } = Route.useParams()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 flex flex-col gap-4" value="dados">
          <div>
            <PdfFileUpload organizationSlug={orgSlug} />
          </div>
          <FetchDataTable organizationSlug={orgSlug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
