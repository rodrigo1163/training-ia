import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, BrainCircuitIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-muted px-4 py-10 text-foreground">
      <div className="w-full max-w-[27rem]">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <BrainCircuitIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">Training IA</span>
        </div>

        <section className="rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          <header className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Erro 404
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Página não encontrada
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              O endereço que você acessou não existe ou foi movido.
            </p>
          </header>

          <Button asChild className="h-11 w-full">
            <Link to="/">
              <ArrowLeftIcon />
              Voltar ao início
            </Link>
          </Button>
        </section>
      </div>
    </main>
  )
}
