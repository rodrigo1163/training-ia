import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AccountSidebar } from "./-components/account-sidebar";
import { ProfileMenu } from "../-components/profile-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@training-ia/ui/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@training-ia/ui/components/ui/sidebar";
import { ScrollArea } from "@training-ia/ui/components/ui/scroll-area";

export const Route = createFileRoute("/(private)/account")({
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden bg-sidebar">
      <AccountSidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden md:m-2 md:rounded-xl md:border md:border-border">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-3 sm:px-4">
          <SidebarTrigger
            aria-label="Open or close sidebar"
            className="size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          />
          <Breadcrumb className="ml-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Preferences</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center">
            <ProfileMenu />
          </div>
        </header>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-full w-full min-w-0 flex-col px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
