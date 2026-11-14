import { createFileRoute } from "@tanstack/react-router";

import { AccountPage } from "./me/-page";

export const Route = createFileRoute("/(private)/account/me")({
  head: () => ({ meta: [{ title: "Preferences | Training IA" }] }),
  component: AccountPage,
});
