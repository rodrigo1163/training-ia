import { Button } from "@training-ia/ui/components/ui/button";

export function DocumentDetailsError({
  error,
  onRetry,
}: {
  error?: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
      <p className="text-sm text-destructive">
        {error?.message ?? "Unable to load the document."}
      </p>
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        Try again
      </Button>
    </div>
  );
}
