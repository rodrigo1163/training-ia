import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { Button } from "@training-ia/ui/components/ui/button";

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
        <h3 className="font-medium">Allowed origins</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define which websites can load and use this bot.
        </p>

        <div className="mt-6 space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Allowed origin
            </span>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter one HTTP(S) origin per field.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button disabled type="button" variant="outline">
              Add origin
            </Button>
            <Button disabled type="button">
              Publish bot
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h3 className="font-medium">Deployment status</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Control the bot&apos;s availability on authorized websites.
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Button disabled type="button" variant="outline">
            Change status
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h3 className="font-medium">Widget installation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the chatbot to your client application code.
        </p>
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste this script before the closing body tag.
          </p>
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </section>
    </div>
  );
}
