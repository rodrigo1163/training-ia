import { Skeleton } from "@training-ia/ui/components/ui/skeleton";

export function DeploymentSkeleton({
  variant,
}: {
  variant: "chat" | "embed";
}) {
  if (variant === "chat") {
    return (
      <div
        aria-label="Loading deployment"
        className="flex min-h-[32rem] w-full min-w-0 flex-col items-center justify-center gap-4 rounded-lg border bg-muted/20 p-4"
      >
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
    );
  }

  return (
    <div
      aria-label="Loading deployment"
      className="w-full max-w-none space-y-6"
    >
      <section className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />

        <div className="mt-6 space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Allowed origin
            </span>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-52 max-w-full" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </section>
    </div>
  );
}
