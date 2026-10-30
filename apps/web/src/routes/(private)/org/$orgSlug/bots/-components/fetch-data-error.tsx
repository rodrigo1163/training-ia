import { Button } from "@training-ia/ui/components/ui/button";

export function FetchDataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-sm text-muted-foreground">
        Unable to load the bot data.
      </span>
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        Try again
      </Button>
    </div>
  );
}
