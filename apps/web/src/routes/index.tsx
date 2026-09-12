import { createFileRoute, redirect } from '@tanstack/react-router'

import { resolveOrganizationHome } from '@/lib/resolve-organization-home'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()

    if (!session) {
      throw redirect({ to: '/sign-in' })
    }

    throw redirect(await resolveOrganizationHome())
  },
})
