import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

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
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
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
