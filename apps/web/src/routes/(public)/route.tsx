import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '@/lib/auth-client'
import { resolveOrganizationHome } from '@/lib/resolve-organization-home'

export const Route = createFileRoute('/(public)')({
  ssr: false,
  beforeLoad: async () => {
    console.log('beforeLoad')
    const { data: session } = await authClient.getSession()
    console.log('session', session)
    if (session) {
      throw redirect(await resolveOrganizationHome())
    }
  },
  component: () => <Outlet />,
})
