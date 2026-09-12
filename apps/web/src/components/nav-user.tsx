import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'

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

const privateRouteApi = getRouteApi('/(private)')

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = privateRouteApi.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut()

      if (result.error) {
        throw new Error(result.error.message ?? 'Não foi possível sair.')
      }
    },
    onSuccess: async () => {
      queryClient.clear()
      await navigate({ to: '/sign-in' })
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground">
                {getInitials(user.name)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground">
                  {getInitials(user.name)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signOutMutation.isPending}
              onSelect={() => signOutMutation.mutate()}
            >
              <LogOutIcon />
              {signOutMutation.isPending ? 'Saindo...' : 'Sair'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
