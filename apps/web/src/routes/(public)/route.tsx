import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { resolveOrganizationHome } from '@/lib/resolve-organization-home'

export const Route = createFileRoute('/(public)')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { session } = context

    if (session) {
      throw redirect(await resolveOrganizationHome(session))
    }
  },
  component: () => <Outlet />,
})
