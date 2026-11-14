import { getRouteApi } from "@tanstack/react-router";

import { AppearanceSection } from "./-components/appearance/appearance-section";
import { DisplayNameSection } from "./-components/display-name/display-name-section";
import { ProfileSection } from "./-components/profile/profile-section";

const privateRouteApi = getRouteApi("/(private)");

export function AccountPage() {
  const { user } = privateRouteApi.useRouteContext();

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and application appearance.
        </p>
      </header>

      <div className="space-y-6">
        <ProfileSection image={user.image} name={user.name} />
        <DisplayNameSection name={user.name} />
        <AppearanceSection />
      </div>
    </main>
  );
}
