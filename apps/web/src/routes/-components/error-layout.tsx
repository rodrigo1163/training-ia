import type { ReactNode } from 'react'
import { BrainCircuitIcon } from 'lucide-react'

type ErrorLayoutProps = {
  children: ReactNode
}

export function ErrorLayout({ children }: ErrorLayoutProps) {
  return (
    <main className="grid min-h-svh bg-background text-foreground md:grid-cols-2 md:gap-4 md:py-4 md:pr-4">
      <section className="flex min-h-svh items-center justify-center px-6 py-12 sm:px-10 lg:px-16 md:min-h-0">
        <div className="w-full max-w-xl">{children}</div>
      </section>

      <aside
        aria-label="Training IA"
        className="hidden min-h-0 place-items-center rounded-2xl bg-muted md:grid"
      >
        <BrainCircuitIcon
          aria-hidden="true"
          className="size-32 text-primary"
          strokeWidth={1.5}
        />
      </aside>
    </main>
  )
}
