import { createFileRoute } from "@tanstack/react-router";

import { AccountPageError } from "./me/-components/account-page-error";
import { AccountPage } from "./me/-page";

export const Route = createFileRoute("/(private)/account/me")({
  head: () => ({ meta: [{ title: "Preferences | Training IA" }] }),
  component: AccountPage,
  errorComponent: ({ error, reset }) => (
    <AccountPageError
      message={error instanceof Error ? error.message : undefined}
      onRetry={reset}
    />
  ),
});
