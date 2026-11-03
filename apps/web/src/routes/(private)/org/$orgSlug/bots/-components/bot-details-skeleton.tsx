import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { Button } from "@training-ia/ui/components/ui/button";
import { Frame } from "@training-ia/ui/components/ui/frame";

import { DeploymentSkeleton } from "./deployment-skeleton";

type BotDetailsTab = "data" | "embed" | "playground";

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

function SkeletonSliderField({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex h-5 items-center px-2">
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4" />
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

function SaveButtonSkeleton() {
  return (
    <div className="flex justify-end">
      <Button disabled type="button">
        Save changes
      </Button>
    </div>
  );
}

function PlaygroundPreviewSkeleton() {
  return (
    <aside className="min-w-0 lg:self-start">
      <div className="min-w-0 lg:min-h-[32rem]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <div aria-hidden="true" className="flex gap-2">
            <Button disabled size="sm" type="button">
              Light
            </Button>
            <Button disabled size="sm" type="button" variant="outline">
              Dark
            </Button>
          </div>
        </div>

        <div
          aria-label="Loading chat preview"
          className="flex min-h-[32rem] w-full flex-col overflow-hidden rounded-xl border bg-card shadow-lg"
          style={{ height: "min(676px, calc(100dvh - 12rem))" }}
        >
          <div className="flex items-center gap-3 border-b bg-muted px-4 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 p-4">
            <Skeleton className="h-20 w-4/5 rounded-lg" />
            <Skeleton className="ml-auto h-14 w-3/5 rounded-lg" />
            <Skeleton className="h-24 w-4/5 rounded-lg" />
          </div>

          <div className="flex flex-wrap gap-2 border-t px-3 py-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
          <div className="flex gap-2 border-t bg-card p-3">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
            <Skeleton className="h-10 w-16 shrink-0 rounded-md" />
          </div>
          <div className="flex justify-center border-t px-2 py-2">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function PlaygroundTabSkeleton() {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,26.5rem)]">
      <div className="min-w-0 space-y-6 lg:pr-3">
        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Bot information</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the name and description used to identify this bot.
            </p>
          </div>
          <div className="mt-6 flex min-w-0 flex-col gap-5">
            <SkeletonField label="Name" />
            <SkeletonField className="h-64 w-full" label="Description" />
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Comportamento</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Define how the bot should communicate and which language to use.
            </p>
          </div>
          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
            <SkeletonField label="Personalidade" />
            <SkeletonField label="Idioma" />
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Bot instructions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust the main instructions used by the bot when generating
              responses.
            </p>
          </div>
          <div className="mt-6">
            <SkeletonField className="h-80 w-full" label="System message" />
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Chat avatar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the image shown next to the assistant messages.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-56 max-w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Chat configuration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes are saved when you click Save changes.
            </p>
          </div>
          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
            <SkeletonField label="Header status" />
            <SkeletonField label="Input placeholder" />
            <SkeletonField label="Submit button text" />
            <div className="md:col-span-2">
              <SkeletonField className="h-24 w-full" label="Initial message" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Starter questions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add up to three unique questions shown in the initial state.
              </p>
            </div>
            <Button disabled type="button" variant="outline">
              Add question
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Style</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust the chat layout, component colors, and floating button
              position.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="h-9 w-24 rounded-md" key={index} />
              ))}
            </div>
          </div>
          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
            {[
              "Chat width",
              "Chat height",
              "Chat corner radius",
              "Message corner radius",
              "Chat border width",
              "Floating button size",
              "Chat shadow",
              "Floating button position",
              "Floating button icon",
              "Chat font family",
              "Message text size",
            ].map((label) => (
              <SkeletonField key={label} label={label} />
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              {[
                "Chat background",
                "Header background",
                "Footer background",
                "Input background",
                "Input text",
                "Suggestions text",
                "Assistant message text",
                "User message text",
                "Assistant message background",
                "User message background",
                "Floating button background",
                "Chat border",
              ].map((label) => (
                <div className="space-y-2" key={label}>
                  <span className="text-sm font-medium text-muted-foreground">
                    {label}
                  </span>
                  <Skeleton className="h-48 w-full max-w-xs rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">AI configuration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure the model and generation parameters used by this bot.
              Changes are saved when you click Save changes.
            </p>
          </div>
          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <SkeletonField label="Model" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <SkeletonSliderField label="Temperature" />
            <SkeletonSliderField label="Max tokens" />
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <Skeleton className="ml-6 h-3 w-3/4" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full max-w-lg" />
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <SkeletonSliderField label="Max messages per day" />
              <SkeletonSliderField label="Max user messages per conversation" />
            </div>
          </div>
          <div className="mt-6">
            <SaveButtonSkeleton />
          </div>
        </section>
      </div>

      <PlaygroundPreviewSkeleton />
    </div>
  );
}

function TabContentSkeleton({ tab }: { tab: BotDetailsTab }) {
  if (tab === "embed") return <DeploymentSkeleton variant="embed" />;
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
        <div className="grid h-10 w-full grid-cols-3 gap-1 rounded-md bg-muted p-1">
          {(["data", "playground", "embed"] as const).map((value) => (
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
                  : "Embed"}
            </span>
          ))}
        </div>
        <TabContentSkeleton tab={tab} />
      </div>
    </div>
  );
}
