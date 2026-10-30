import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@training-ia/ui/components/ui/button";
import { Skeleton } from "@training-ia/ui/components/ui/skeleton";

export function OrganizationRoutePending() {
  return (
    <main
      aria-label="Loading organizations"
      className="grid min-h-svh place-items-center bg-muted px-4 py-10"
    >
      <section className="w-full max-w-[27rem] rounded-md border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <div className="mt-7 space-y-2">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </section>
    </main>
  );
}

export function OrganizationRouteError({
  error,
  reset,
}: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : "Unable to load organizations.";

  return (
    <main className="grid min-h-svh place-items-center bg-muted px-4 py-10">
      <section className="w-full max-w-[27rem] rounded-md border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-lg font-semibold">Unable to load organizations</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-6" onClick={reset} type="button" variant="outline">
          Try again
        </Button>
      </section>
    </main>
  );
}
