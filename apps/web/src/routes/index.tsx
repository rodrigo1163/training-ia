import { createFileRoute, redirect } from '@tanstack/react-router'

import { SplashScreen } from '@/components/splash-screen'
import { resolveOrganizationHome } from '@/lib/resolve-organization-home'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }

    throw redirect(await resolveOrganizationHome())
  },
  pendingComponent: SplashScreen,
})
