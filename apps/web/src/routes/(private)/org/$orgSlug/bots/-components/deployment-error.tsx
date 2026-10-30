import { Button } from "@training-ia/ui/components/ui/button";

type DeploymentErrorProps = {
  onOpenEmbed?: () => void | Promise<void>;
  onRetry: () => void | Promise<unknown>;
};

export function DeploymentError({
  onOpenEmbed,
  onRetry,
}: DeploymentErrorProps) {
  return (
    <div className="flex min-h-[32rem] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 text-center">
      <h2 className="font-medium">Unable to load the deployment</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load the bot publication settings. Please try again.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={() => void onRetry()} size="sm" type="button">
          Try again
        </Button>
        {onOpenEmbed && (
          <Button
            onClick={() => void onOpenEmbed()}
            size="sm"
            type="button"
            variant="outline"
          >
            Open Embed
          </Button>
        )}
      </div>
    </div>
  );
}
