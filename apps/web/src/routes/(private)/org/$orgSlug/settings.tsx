import { createFileRoute } from "@tanstack/react-router";

import { OrganizationNameSection } from "./settings/-components/organization-name-section";

export const Route = createFileRoute("/(private)/org/$orgSlug/settings")({
  head: () => ({ meta: [{ title: "Organization settings | Training IA" }] }),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { activeOrganization } = Route.useRouteContext();

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Organization
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the details of your organization.
        </p>
      </header>

      <OrganizationNameSection
        name={activeOrganization.name}
        organizationId={activeOrganization.id}
      />
    </main>
  );
}
