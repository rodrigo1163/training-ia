import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { Button } from "@training-ia/ui/components/ui/button";
import { Frame } from "@training-ia/ui/components/ui/frame";

import { DeploymentSkeleton } from "./deployment-skeleton";

type BotDetailsTab = "chat" | "data" | "embed" | "playground";

function SkeletonField({
  label,
  className = "h-10 w-full",
}: {
  className?: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Skeleton className={className} />
    </div>
  );
}

function DataTabSkeleton() {
  return (
    <div className="@container w-full min-w-0 max-w-full">
      <Frame className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border bg-card p-0">
      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:flex-1 sm:max-w-xs">
            <SkeletonField
              className="h-9 w-full rounded-md"
              label="Search documents"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <div className="flex items-end gap-2">
            <Skeleton
              aria-label="Loading page size"
              className="h-9 w-20 rounded-md"
            />
            <Button disabled type="button">
              Add document
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden min-w-0 @min-[60rem]:block">
        <div className="w-full min-w-[58rem]">
          <div className="grid grid-cols-[2.5rem_minmax(16rem,1fr)_6rem_7rem_8rem] items-center gap-4 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
            <span aria-label="Select all documents" className="sr-only">
              Select all documents
            </span>
            <Skeleton className="size-4 rounded-sm" />
            <span>Document</span>
            <span>Size</span>
            <span>Status</span>
            <span className="sr-only">Actions</span>
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              className="grid grid-cols-[2.5rem_minmax(16rem,1fr)_6rem_7rem_8rem] items-center gap-4 border-b px-4 py-3 last:border-b-0"
              key={index}
            >
              <Skeleton className="size-4 rounded-sm" />
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <div className="flex justify-end">
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-4 @min-[40rem]:grid-cols-2 @min-[60rem]:hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="rounded-lg border bg-background p-4" key={index}>
            <div className="flex items-start gap-3">
              <Skeleton className="mt-1 size-4 rounded-sm" />
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="size-8 shrink-0 rounded-md" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center justify-end gap-1">
          <Button disabled size="sm" type="button" variant="ghost">
            Previous
          </Button>
          <Button disabled size="sm" type="button" variant="ghost">
            1
          </Button>
          <Button disabled size="sm" type="button" variant="ghost">
            2
          </Button>
          <Button disabled size="sm" type="button" variant="ghost">
            3
          </Button>
          <Button disabled size="sm" type="button" variant="ghost">
            Next
          </Button>
        </div>
      </div>
      </Frame>
    </div>
  );
}

function PlaygroundTabSkeleton() {
  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h3 className="font-medium">Bot information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the name and description used to identify this bot.
          </p>
        </div>
        <SkeletonField label="Name" />
        <SkeletonField className="h-24 w-full" label="Description" />
        <div className="flex justify-end">
          <Button disabled type="button">
            Save changes
          </Button>
        </div>
      </section>
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h3 className="font-medium">Comportamento</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Define how the bot should communicate and which language to use.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonField label="Personality" />
          <SkeletonField label="Language" />
        </div>
        <div className="flex justify-end">
          <Button disabled type="button">
            Save changes
          </Button>
        </div>
      </section>
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h3 className="font-medium">Bot instructions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust the main instructions used by the bot when generating
            responses.
          </p>
        </div>
        <SkeletonField className="h-32 w-full" label="System message" />
        <div className="flex justify-end">
          <Button disabled type="button">
            Save changes
          </Button>
        </div>
      </section>
    </div>
  );
}

function TabContentSkeleton({ tab }: { tab: BotDetailsTab }) {
  if (tab === "embed") return <DeploymentSkeleton variant="embed" />;
  if (tab === "chat") return <DeploymentSkeleton variant="chat" />;
  if (tab === "playground") return <PlaygroundTabSkeleton />;
  return <DataTabSkeleton />;
}

export function BotDetailsSkeleton({ tab }: { tab: BotDetailsTab }) {
  return (
    <div
      aria-label="Loading bot details"
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 py-4"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-52" />
        <p className="text-sm text-muted-foreground">
          Configure and monitor this bot.
        </p>
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-4">
        <div className="grid h-10 w-full grid-cols-4 gap-1 rounded-md bg-muted p-1">
          {(["data", "playground", "embed", "chat"] as const).map(
            (value) => (
              <span
                className={`flex items-center justify-center rounded-sm px-3 text-sm ${
                  tab === value
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                key={value}
              >
                {value === "data"
                  ? "Data"
                  : value === "playground"
                    ? "Playground"
                    : value === "embed"
                      ? "Embed"
                      : "Chat"}
              </span>
            ),
          )}
        </div>
        <TabContentSkeleton tab={tab} />
      </div>
    </div>
  );
}
