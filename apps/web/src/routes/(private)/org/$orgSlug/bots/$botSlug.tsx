import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useBotQuery } from "@/hooks/use-bots";

import { BotDetailsError } from "./-components/bot-details-error";
import { BotDetailsSkeleton } from "./-components/bot-details-skeleton";
import { BotEmbed } from "./-components/bot-embed";
import { BotPlayground } from "./-components/bot-playground/bot-playground";
import { FetchDataTable } from "./-components/fetch-data-table";
import { UploadActions } from "./-components/upload-actions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@training-ia/ui/components/ui/tabs";

const botTabs = ["data", "playground", "embed"] as const;
type BotTab = (typeof botTabs)[number];

function isBotTab(value: unknown): value is BotTab {
  return typeof value === "string" && botTabs.includes(value as BotTab);
}

export const Route = createFileRoute("/(private)/org/$orgSlug/bots/$botSlug")({
  head: () => ({ meta: [{ title: "Bot | Training IA" }] }),
  validateSearch: (search): { tab?: BotTab } => ({
    tab:
      search.tab === "chat"
        ? "playground"
        : isBotTab(search.tab)
          ? search.tab
          : "data",
  }),
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { orgSlug, botSlug } = Route.useParams();
  const { tab } = Route.useSearch();
  const activeTab = tab ?? "data";
  const navigate = useNavigate();
  const query = useBotQuery(orgSlug, botSlug);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") !== "chat") {
      return;
    }

    void navigate({
      params: { botSlug, orgSlug },
      replace: true,
      search: (previous) => ({ ...previous, tab: "playground" }),
      to: "/org/$orgSlug/bots/$botSlug",
    });
  }, [botSlug, navigate, orgSlug]);

  const setActiveTab = async (tab: string): Promise<void> => {
    if (!isBotTab(tab)) return;

    await navigate({
      params: { botSlug, orgSlug },
      replace: true,
      search: (previous) => ({ ...previous, tab }),
      to: "/org/$orgSlug/bots/$botSlug",
    });
  };

  const handleOpenEmbed = () => setActiveTab("embed");

  if (query.isPending) {
    return <BotDetailsSkeleton tab={activeTab} />;
  }

  if (query.isError || !query.data) {
    return <BotDetailsError onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 py-4 lg:overflow-hidden">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{query.data.name}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Configure and monitor this bot.
        </p>
      </div>
      <Tabs
        className="min-h-0 min-w-0 flex-1 lg:overflow-hidden"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent
          className="mt-4 flex min-h-0 w-full min-w-0 max-w-full flex-col gap-4"
          value="data"
        >
          <FetchDataTable
            botSlug={botSlug}
            orgSlug={orgSlug}
            tabs={null}
            uploadAction={<UploadActions botSlug={botSlug} orgSlug={orgSlug} />}
          />
        </TabsContent>

        <TabsContent
          className="mt-4 flex min-h-0 min-w-0 flex-1 overflow-visible lg:overflow-hidden"
          value="playground"
        >
          {query.data && (
            <BotPlayground
              bot={query.data}
              botSlug={botSlug}
              onOpenEmbed={handleOpenEmbed}
              orgSlug={orgSlug}
            />
          )}
        </TabsContent>

        <TabsContent className="mt-4 min-h-0 min-w-0 flex-1" value="embed">
          {query.data && <BotEmbed botSlug={botSlug} orgSlug={orgSlug} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
