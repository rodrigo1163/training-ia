import { useMutation } from '@tanstack/react-query'
import {
  getRouteApi,
  useMatchRoute,
  useNavigate,
} from '@tanstack/react-router'
import {
  Building2Icon,
  ChevronsUpDownIcon,
  ListIcon,
  PlusIcon,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'

const organizationRouteApi = getRouteApi('/(private)/org/$orgSlug')
const MAX_VISIBLE_ORGANIZATIONS = 3

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar()
  const { activeOrganization, organizations } =
    organizationRouteApi.useRouteContext()
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { orgSlug } = organizationRouteApi.useParams()
  const previewOrganizations = [
    activeOrganization,
    ...organizations.filter(
      (organization) => organization.id !== activeOrganization.id,
    ),
  ].slice(0, MAX_VISIBLE_ORGANIZATIONS)

  const switchOrganizationMutation = useMutation({
    mutationFn: async (organization: (typeof organizations)[number]) => {
      const result = await authClient.organization.setActive({
        organizationId: organization.id,
      })

      if (result.error) {
        throw new Error(
          result.error.message ?? 'Não foi possível trocar de organização.',
        )
      }

      return organization
    },
    onSuccess: async (organization) => {
      const isBots = Boolean(
        matchRoute({
          to: '/org/$orgSlug/bots',
          params: { orgSlug },
        }),
      )

      await navigate({
        to: isBots ? '/org/$orgSlug/bots' : '/org/$orgSlug/dashboard',
        params: { orgSlug: organization.slug },
      })
    },
    onError: (error) => {
      toast.add({
        title: error.message,
        type: 'error',
      })
    },
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization.name}
                </span>
                <span className="truncate text-xs">
                  {activeOrganization.slug}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizações
            </DropdownMenuLabel>
            {previewOrganizations.map((organization) => (
              <DropdownMenuItem
                key={organization.id}
                className="gap-2 p-2"
                disabled={
                  switchOrganizationMutation.isPending ||
                  organization.id === activeOrganization.id
                }
                onSelect={() => switchOrganizationMutation.mutate(organization)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2Icon className="size-3.5 shrink-0" />
                </div>
                {organization.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={() => navigate({ to: '/organizations' })}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <ListIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Organizações
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={() => navigate({ to: '/create-organization' })}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Adicionar organização
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
