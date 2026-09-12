import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/(private)')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    return { user: session.user }
  },
  component: () => <Outlet />,
})
