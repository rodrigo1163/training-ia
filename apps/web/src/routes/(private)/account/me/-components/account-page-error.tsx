import { CircleAlertIcon } from "lucide-react";

import { Button } from "@training-ia/ui/components/ui/button";

type AccountPageErrorProps = {
  message?: string;
  onRetry: () => void;
};

export function AccountPageError({
  message,
  onRetry,
}: AccountPageErrorProps) {
  return (
    <main
      aria-live="polite"
      className="mx-auto flex min-h-80 w-full max-w-3xl items-center justify-center"
    >
      <section className="w-full rounded-xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
        <CircleAlertIcon
          aria-hidden="true"
          className="mx-auto size-10 text-destructive"
        />
        <h1 className="mt-4 text-lg font-semibold">Unable to load account</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {message ?? "We could not load your account preferences."}
        </p>
        <Button
          className="mt-6"
          onClick={onRetry}
          type="button"
          variant="outline"
        >
          Try again
        </Button>
      </section>
    </main>
  );
}
