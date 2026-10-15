import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { botQueryKey, fetchBot } from "@/components/bots/bots";
import { BotEmbed } from "@/components/bots/bot-embed";
import { BotPlayground } from "@/components/bots/bot-playground";
import { FetchDataTable } from "@/components/bots/fetch-data-table";
import { UploadActions } from "@/components/bots/upload-actions";
import { Button } from "@training-ia/ui/components/ui/button";
import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@training-ia/ui/components/ui/tabs";

export const Route = createFileRoute("/(private)/org/$orgSlug/bots/$botSlug")({
  head: () => ({ meta: [{ title: "Bot | Training IA" }] }),
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { orgSlug, botSlug } = Route.useParams();
  const [activeTab, setActiveTab] = useState("dados");
  const query = useQuery({
    queryKey: botQueryKey(orgSlug, botSlug),
    queryFn: () => fetchBot(orgSlug, botSlug),
  });

  useEffect(() => {
    const botId = query.data?.id;

    if (!botId || activeTab !== "embed") return;

    const script = document.createElement("script");
    script.async = true;
    script.dataset.botId = botId;
    script.src = `http://localhost:5174/src/embed.tsx?botId=${encodeURIComponent(botId)}&instance=${Date.now()}`;
    script.type = "module";

    document.body.appendChild(script);

    return () => {
      document.querySelector<HTMLElement>(`[data-widget-id="${botId}"]`)?.remove();
      script.remove();
    };
  }, [activeTab, query.data?.id]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        {query.isPending ? (
          <Skeleton className="h-7 w-52" />
        ) : query.isError ? null : (
          <h1 className="text-xl font-semibold">{query.data.name}</h1>
        )}
      </div>

      {query.isError ? (
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
      ) : null}

      {!query.isError && (
        <Tabs
          className="flex-1"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList>
            <TabsTrigger value="dados">Data</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4 flex flex-col gap-4" value="dados">
            <FetchDataTable
              botSlug={botSlug}
              orgSlug={orgSlug}
              tabs={null}
              uploadAction={
                <UploadActions botSlug={botSlug} orgSlug={orgSlug} />
              }
            />
          </TabsContent>

          <TabsContent className="mt-4 flex-1" value="playground">
            {query.data ? (
              <BotPlayground
                bot={query.data}
                botSlug={botSlug}
                orgSlug={orgSlug}
              />
            ) : null}
          </TabsContent>

          <TabsContent className="mt-4 flex-1" value="embed">
            {query.data ? <BotEmbed bot={query.data} /> : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
