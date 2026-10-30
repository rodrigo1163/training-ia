import { Skeleton } from "@training-ia/ui/components/ui/skeleton";

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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <SkeletonField label="Search documents" />
        </div>
        <SkeletonField className="h-10 w-32" label="Documents per page" />
      </div>
      <div className="space-y-3 rounded-lg border p-5">
        <div className="flex items-center gap-4 border-b pb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ml-auto h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div className="flex items-center gap-4" key={index}>
            <Skeleton className="h-10 min-w-0 flex-1" />
            <Skeleton className="h-10 w-16 shrink-0" />
            <Skeleton className="h-10 w-20 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaygroundTabSkeleton() {
  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <SkeletonField label="Name" />
        <SkeletonField className="h-24 w-full" label="Description" />
      </section>
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonField label="Personality" />
          <SkeletonField label="Language" />
        </div>
      </section>
      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <SkeletonField className="h-32 w-full" label="System message" />
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
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-4">
        <div className="grid h-10 w-full grid-cols-4 gap-1 rounded-md bg-muted p-1">
          <Skeleton className="h-8 rounded-sm" />
          <Skeleton className="h-8 rounded-sm" />
          <Skeleton className="h-8 rounded-sm" />
          <Skeleton className="h-8 rounded-sm" />
        </div>
        <TabContentSkeleton tab={tab} />
      </div>
    </div>
  );
}
