import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { botQueryKey, fetchBot } from "@/components/bots/bots";
import { BotChat } from "@/components/bots/bot-chat";
import { BotEmbed } from "@/components/bots/bot-embed";
import { BotPlayground } from "@/components/bots/bot-playground";
import { FetchDataTable } from "@/components/bots/fetch-data-table";
import { UploadActions } from "@/components/bots/upload-actions";
import { Button } from "@training-ia/ui/components/ui/button";
import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@training-ia/ui/components/ui/tabs";

const botTabs = ["data", "playground", "chat", "embed"] as const;
type BotTab = (typeof botTabs)[number];

function isBotTab(value: unknown): value is BotTab {
  return typeof value === "string" && botTabs.includes(value as BotTab);
}

export const Route = createFileRoute("/(private)/org/$orgSlug/bots/$botSlug")({
  head: () => ({ meta: [{ title: "Bot | Training IA" }] }),
  validateSearch: (search): { tab?: BotTab } => ({
    tab: isBotTab(search.tab) ? search.tab : "data",
  }),
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { orgSlug, botSlug } = Route.useParams();
  const { tab } = Route.useSearch();
  const activeTab = tab ?? "data";
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: botQueryKey(orgSlug, botSlug),
    queryFn: () => fetchBot(orgSlug, botSlug),
  });

  const setActiveTab = (tab: string) => {
    if (!isBotTab(tab)) return;

    void navigate({
      params: { botSlug, orgSlug },
      replace: true,
      search: (previous) => ({ ...previous, tab }),
      to: "/org/$orgSlug/bots/$botSlug",
    });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 py-4">
      <div className="flex flex-col gap-1">
        {query.isPending ? (
          <>
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80" />
          </>
        ) : query.isError ? null : (
          <>
            <h1 className="text-xl font-semibold">{query.data.name}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Configure and monitor this bot.
            </p>
          </>
        )}
      </div>

      {query.isError ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Unable to load the bot.
          </p>
          <Button
            onClick={() => query.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!query.isError && (
        <Tabs
          className="min-w-0 flex-1"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <TabsContent
            className="mt-4 flex w-full min-w-0 max-w-full flex-col gap-4"
            value="data"
          >
            <FetchDataTable
              botSlug={botSlug}
              orgSlug={orgSlug}
              tabs={null}
              uploadAction={
                <UploadActions botSlug={botSlug} orgSlug={orgSlug} />
              }
            />
          </TabsContent>

          <TabsContent className="mt-4 min-w-0 flex-1" value="playground">
            {query.data ? (
              <BotPlayground
                bot={query.data}
                botSlug={botSlug}
                orgSlug={orgSlug}
              />
            ) : null}
          </TabsContent>

          <TabsContent className="mt-4 min-w-0 flex-1" value="chat">
            {query.data ? (
              <BotChat botSlug={botSlug} orgSlug={orgSlug} />
            ) : null}
          </TabsContent>

          <TabsContent className="mt-4 flex-1" value="embed">
            {query.data ? (
              <BotEmbed botSlug={botSlug} orgSlug={orgSlug} />
            ) : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
