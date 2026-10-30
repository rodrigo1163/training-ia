import { Button } from "@training-ia/ui/components/ui/button";

export function BotDetailsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 py-4">
      <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-2 rounded-lg border text-center">
        <h1 className="font-medium">Unable to load the bot</h1>
        <p className="text-sm text-muted-foreground">
          Please try again to load this bot&apos;s details.
        </p>
        <Button onClick={onRetry} size="sm" type="button" variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
