import {
  Outlet,
  Link,
  createFileRoute,
  redirect,
  useMatchRoute,
  useRouterState,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { botQueryOptions } from '@/hooks/use-bots'
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
  const { activeOrganization } = Route.useRouteContext()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const isBotsIndex = Boolean(
    matchRoute({
      to: '/org/$orgSlug/bots',
      params: { orgSlug },
    }),
  )

  const botMatch = pathname.match(/\/bots\/([^/]+)/)
  const botId = botMatch?.[1]

  const { data: bot } = useQuery({
    ...botQueryOptions(activeOrganization.id, botId ?? ''),
    enabled: Boolean(botId),
  })

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
              {botId ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link params={{ orgSlug }} to="/org/$orgSlug/bots">
                        Bots
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{bot?.name ?? 'Bot'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {isBotsIndex ? 'Bots' : 'Dashboard'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
