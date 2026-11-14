import type { ComponentProps } from "react";
import { Link, getRouteApi, useMatchRoute } from "@tanstack/react-router";

import { OrganizationSwitcher } from "./organization-switcher";
import { cn } from "@/lib/utils";
import { Settings2Icon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@training-ia/ui/components/ui/sidebar";

const organizationRouteApi = getRouteApi("/(private)/org/$orgSlug");

const navMain = [
  {
    title: "Menu",
    items: [
      {
        title: "Dashboard",
        to: "/org/$orgSlug/dashboard" as const,
      },
      {
        title: "Bots",
        to: "/org/$orgSlug/bots" as const,
      },
    ],
  },
];

const navSecondary = [
  {
    title: "Settings",
    items: [
      {
        title: "Organization settings",
        to: "/org/$orgSlug/settings" as const,
        icon: Settings2Icon,
      },
    ],
  },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const { orgSlug } = organizationRouteApi.useParams();

  return (
    <Sidebar
      {...props}
      className={cn("border-sidebar-border/0", props.className)}
    >
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={Boolean(
                        matchRoute({
                          to: item.to,
                          params: { orgSlug },
                          fuzzy: item.title === "Bots",
                        }),
                      )}
                    >
                      <Link params={{ orgSlug }} to={item.to}>
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {navSecondary.map((group) => (
          <SidebarGroup className="mt-auto" key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={Boolean(
                          matchRoute({
                            to: item.to,
                            params: { orgSlug },
                          }),
                        )}
                      >
                        <Link params={{ orgSlug }} to={item.to}>
                          <Icon />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
