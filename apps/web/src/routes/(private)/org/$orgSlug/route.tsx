import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { BellIcon, MoonIcon, SunIcon } from "lucide-react";
import { Fragment } from "react";

import {
  OrganizationRouteError,
  OrganizationRoutePending,
} from "../../-components/organization-route-states";
import { AppSidebar } from "./-components/app-sidebar";
import { ProfileMenu } from "./-components/nav-user";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@training-ia/ui/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@training-ia/ui/components/ui/sidebar";
import { ScrollArea } from "@training-ia/ui/components/ui/scroll-area";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/(private)/org/$orgSlug")({
  errorComponent: OrganizationRouteError,
  beforeLoad: async ({ params }) => {
    const [{ data: session }, { data: organizations, error }] =
      await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ]);

    if (error) {
      throw new Error(
        error.message ?? "Unable to load organizations.",
      );
    }

    if (!organizations || organizations.length === 0) {
      throw redirect({ to: "/create-organization" });
    }

    const activeOrganization = organizations.find(
      (organization) => organization.slug === params.orgSlug,
    );

    if (!activeOrganization) {
      throw redirect({
        to: "/org/$orgSlug/dashboard",
        params: { orgSlug: organizations[0].slug },
      });
    }

    const activeOrganizationId = session?.session.activeOrganizationId ?? null;

    if (activeOrganizationId !== activeOrganization.id) {
      const setActiveResult = await authClient.organization.setActive({
        organizationId: activeOrganization.id,
      });

      if (setActiveResult.error) {
        throw new Error(
          setActiveResult.error.message ??
            "Unable to activate the organization.",
        );
      }
    }

    return {
      activeOrganization,
      organizations,
    };
  },
  component: OrganizationLayout,
  pendingComponent: OrganizationRoutePending,
});

function OrganizationLayout() {
  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden bg-sidebar">
      <AppSidebar collapsible="offcanvas" />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden md:m-2 md:rounded-xl md:border md:border-border">
        <DashboardHeader />
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-full w-full min-w-0 flex-col px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardHeader() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-3 sm:px-4">
      <SidebarTrigger
          aria-label="Open or close sidebar"
        className="size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      />
      <DashboardBreadcrumb />

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <button
          aria-label="Notifications"
          className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          type="button"
        >
          <BellIcon className="size-[17px]" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
        </button>
        <button
          aria-label="Alternar tema"
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={toggleTheme}
          title="Alternar tema"
          type="button"
        >
          {theme === "dark" ? (
            <SunIcon className="size-[17px]" />
          ) : (
            <MoonIcon className="size-[17px]" />
          )}
        </button>
        <div className="ml-1 flex">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function DashboardBreadcrumb() {
  const { orgSlug } = Route.useParams();
  const { pathname } = useLocation();
  const pathSegments = pathname.split("/").filter(Boolean);
  const botsSegmentIndex = pathSegments.indexOf("bots");
  const botSlug =
    botsSegmentIndex >= 0 ? pathSegments[botsSegmentIndex + 1] : undefined;
  const botLabel = botSlug ? formatBreadcrumbLabel(botSlug) : undefined;

  const items = botLabel
    ? [
        { label: "Bots", to: "/org/$orgSlug/bots" as const },
        { label: botLabel },
      ]
    : pathname.includes("/bots")
      ? [{ label: "Bots" }]
      : [{ label: "Dashboard" }];

  return (
    <Breadcrumb className="ml-2 min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="min-w-0">
              {item.to ? (
                <BreadcrumbLink asChild>
                  <Link params={{ orgSlug }} to={item.to}>
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function formatBreadcrumbLabel(value: string) {
  return decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
