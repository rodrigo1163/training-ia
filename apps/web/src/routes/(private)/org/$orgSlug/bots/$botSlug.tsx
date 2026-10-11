import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { botQueryKey, fetchBot } from "@/components/bots/bots";
import { FetchDataTable } from "@/components/bots/fetch-data-table";
import { PdfFileUpload } from "@/components/bots/pdf-file-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/(private)/org/$orgSlug/bots/$botSlug")({
  head: () => ({ meta: [{ title: "Bot | Training IA" }] }),
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { orgSlug, botSlug } = Route.useParams();
  const query = useQuery({
    queryKey: botQueryKey(orgSlug, botSlug),
    queryFn: () => fetchBot(orgSlug, botSlug),
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {query.isPending ? (
        <div className="grid gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : query.isError ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o bot.
          </p>
          <Button
            onClick={() => query.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-semibold">{query.data.name}</h1>
          <p className="text-sm text-muted-foreground">{query.data.slug}</p>
        </div>
      )}

      {!query.isError && (
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4 flex flex-col gap-4" value="dados">
            <div>
              <PdfFileUpload botSlug={botSlug} organizationSlug={orgSlug} />
            </div>
            <FetchDataTable botSlug={botSlug} organizationSlug={orgSlug} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
