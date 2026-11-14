import { createFileRoute, redirect } from '@tanstack/react-router'

import { SplashScreen } from '@/components/splash-screen'
import { resolveOrganizationHome } from '@/lib/resolve-organization-home'

export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { session } = context

    if (!session) {
      throw redirect({ to: '/sign-in' })
    }

    throw redirect(await resolveOrganizationHome(session))
  },
  pendingComponent: SplashScreen,
})
