import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/(public)')({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()

    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <Outlet />,
})
