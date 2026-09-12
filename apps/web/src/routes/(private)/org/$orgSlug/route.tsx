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

export const Route = createFileRoute('/(private)/org/$orgSlug')({
  beforeLoad: async ({ params }) => {
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

    const activeOrganization = organizations.find(
      (organization) => organization.slug === params.orgSlug,
    )

    if (!activeOrganization) {
      throw redirect({
        to: '/org/$orgSlug/dashboard',
        params: { orgSlug: organizations[0].slug },
      })
    }

    const activeOrganizationId = session?.session.activeOrganizationId ?? null

    if (activeOrganizationId !== activeOrganization.id) {
      const setActiveResult = await authClient.organization.setActive({
        organizationId: activeOrganization.id,
      })

      if (setActiveResult.error) {
        throw new Error(
          setActiveResult.error.message ??
            'Não foi possível ativar a organização.',
        )
      }
    }

    return {
      activeOrganization,
      organizations,
    }
  },
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const matchRoute = useMatchRoute()
  const { orgSlug } = Route.useParams()
  const pageTitle = matchRoute({
    to: '/org/$orgSlug/bots',
    params: { orgSlug },
  })
    ? 'Bots'
    : 'Dashboard'

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
