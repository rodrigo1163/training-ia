import {
  Outlet,
  createFileRoute,
  redirect,
  useMatchRoute,
} from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/(private)/_main')({
  beforeLoad: async () => {
    const [{ data: session }, { data: organizations, error }] =
      await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ])

    if (error) {
      throw new Error(
        error.message ?? 'Não foi possível carregar as organizações.',
      )
    }

    if (!organizations || organizations.length === 0) {
      throw redirect({ to: '/create-organization' })
    }

    let activeOrganizationId = session?.session.activeOrganizationId ?? null

    if (!activeOrganizationId) {
      const firstOrganization = organizations[0]
      const setActiveResult = await authClient.organization.setActive({
        organizationId: firstOrganization.id,
      })

      if (setActiveResult.error) {
        throw new Error(
          setActiveResult.error.message ??
            'Não foi possível ativar a organização.',
        )
      }

      activeOrganizationId = firstOrganization.id
    }

    const activeOrganization =
      organizations.find(
        (organization) => organization.id === activeOrganizationId,
      ) ?? organizations[0]

    return { activeOrganization }
  },
  component: MainLayout,
})

function MainLayout() {
  const matchRoute = useMatchRoute()
  const pageTitle = matchRoute({ to: '/bots' }) ? 'Bots' : 'Dashboard'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            className="mr-2 data-[orientation=vertical]:h-4"
            orientation="vertical"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
