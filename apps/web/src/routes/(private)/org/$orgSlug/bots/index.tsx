import { createFileRoute } from "@tanstack/react-router";

import { BotsTable } from "@/components/bots/bots-table";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";

export const Route = createFileRoute("/(private)/org/$orgSlug/bots/")({
  head: () => ({ meta: [{ title: "Bots | Training IA" }] }),
  component: BotsPage,
});

function BotsPage() {
  const { orgSlug } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Bots</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os bots e seus documentos.
          </p>
        </div>
        <CreateBotDialog orgSlug={orgSlug} />
      </div>
      <BotsTable orgSlug={orgSlug} />
    </div>
  );
}
