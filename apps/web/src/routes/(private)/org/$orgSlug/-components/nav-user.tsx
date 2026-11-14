import type { ReactElement } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ChevronsUpDownIcon,
  CircleUserRoundIcon,
  LogOutIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@training-ia/ui/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@training-ia/ui/components/ui/sidebar";
import { ButtonSpinner } from "@/components/button-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "@training-ia/ui/components/ui/toast";
import { authClient } from "@/lib/auth-client";

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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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

export function ProfileMenu() {
  const { user } = privateRouteApi.useRouteContext();

  return (
    <UserMenu
      align="end"
      side="bottom"
      sideOffset={8}
      trigger={
        <button
          aria-label="Open profile"
          className="relative inline-flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground outline-none ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <UserAvatar image={user.image} name={user.name} showStatus />
        </button>
      }
    />
  );
}

type UserMenuProps = {
  align: "start" | "center" | "end";
  side: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  trigger: ReactElement;
};

function UserMenu({ align, side, sideOffset = 4, trigger }: UserMenuProps) {
  const { user } = privateRouteApi.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message ?? "Unable to sign out.");
      }
    },
    onSuccess: async () => {
      queryClient.clear();
      await router.invalidate({ sync: true });
      await navigate({ to: "/sign-in" });
    },
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 rounded-lg"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserAvatar image={user.image} name={user.name} showStatus />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/account/me" })}>
          <CircleUserRoundIcon />
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOutMutation.isPending}
          onSelect={() => signOutMutation.mutate()}
        >
          <LogOutIcon />
          {signOutMutation.isPending ? "Signing out..." : "Sign out"}
          {signOutMutation.isPending && <ButtonSpinner />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
