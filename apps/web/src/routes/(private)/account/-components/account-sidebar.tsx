import {
  Link,
  useCanGoBack,
  useMatchRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  KeyRoundIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

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

export function AccountSidebar() {
  const canGoBack = useCanGoBack();
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const router = useRouter();

  function goBackToDashboard() {
    if (canGoBack) {
      router.history.back();
      return;
    }

    void navigate({ to: "/" });
  }

  return (
    <Sidebar className="border-sidebar-border/0" collapsible="offcanvas">
      <SidebarHeader>
        <button
          className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={goBackToDashboard}
          type="button"
        >
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(matchRoute({ to: "/account/me" }))}
                >
                  <Link to="/account/me">
                    <SlidersHorizontalIcon />
                    Preferences
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(matchRoute({ to: "/account/security" }))}
                >
                  <Link to="/account/security">
                    <KeyRoundIcon />
                    Security
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
