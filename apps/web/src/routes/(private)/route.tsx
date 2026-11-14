import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(private)')({
  ssr: false,
  beforeLoad: ({ context, location }) => {
    const { session } = context

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    return { session, user: session.user }
  },
  component: () => <Outlet />
})
