import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { NotFound } from '@/components/not-found'
import { Toaster } from '@/components/ui/toast'

import '../global.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Training IA',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootComponent() {
  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
