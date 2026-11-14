import { getRouteApi } from "@tanstack/react-router";
import { ChevronsUpDownIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@training-ia/ui/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { UserMenu } from "../../../-components/profile-menu";

const privateRouteApi = getRouteApi("/(private)");

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = privateRouteApi.useRouteContext();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu
          align="end"
          side={isMobile ? "bottom" : "right"}
          trigger={
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar image={user.image} name={user.name} showStatus />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
