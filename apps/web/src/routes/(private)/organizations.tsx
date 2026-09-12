import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  Building2Icon,
  CheckIcon,
  PlusIcon,
} from 'lucide-react'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/(private)/organizations')({
  head: () => ({ meta: [{ title: 'Organizações | Training IA' }] }),
  beforeLoad: async () => {
    const [{ data: session }, { data: organizations, error }] =
      await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ])

    if (error) {
      throw new Error(
        error.message ?? 'Não foi possível carregar as organizações.',
      )
    }

    if (!organizations || organizations.length === 0) {
      throw redirect({ to: '/create-organization' })
    }

    return {
      activeOrganizationId: session?.session.activeOrganizationId ?? null,
      organizations,
    }
  },
  component: OrganizationsPage,
})

function OrganizationsPage() {
  const navigate = useNavigate()
  const { activeOrganizationId, organizations } = Route.useRouteContext()

  const switchOrganizationMutation = useMutation({
    mutationFn: async (organization: (typeof organizations)[number]) => {
      if (organization.id === activeOrganizationId) {
        return organization
      }

      const result = await authClient.organization.setActive({
        organizationId: organization.id,
      })

      if (result.error) {
        throw new Error(
          result.error.message ?? 'Não foi possível trocar de organização.',
        )
      }

      return organization
    },
    onSuccess: async (organization) => {
      await navigate({
        to: '/org/$orgSlug/dashboard',
        params: { orgSlug: organization.slug },
      })
    },
    onError: (error) => {
      toast.add({
        title: error.message,
        type: 'error',
      })
    },
  })

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
              Organização
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Suas organizações
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Escolha uma organização para acessar o painel.
            </p>
          </header>

          <ScrollArea
            className="max-h-[min(18rem,calc(100svh-24rem))]"
            type="auto"
          >
            <ul className="flex flex-col gap-2 pr-3">
              {organizations.map((organization) => {
                const isActive = organization.id === activeOrganizationId

                return (
                  <li key={organization.id}>
                    <button
                      className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60"
                      disabled={switchOrganizationMutation.isPending}
                      onClick={() =>
                        switchOrganizationMutation.mutate(organization)
                      }
                      type="button"
                    >
                      <span className="flex size-9 items-center justify-center rounded-md border bg-card">
                        <Building2Icon className="size-4" />
                      </span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-medium">
                          {organization.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {organization.slug}
                        </span>
                      </span>
                      {isActive ? (
                        <CheckIcon className="size-4 text-primary" />
                      ) : (
                        <ArrowRightIcon className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>

          <Button
            className="mt-5 h-11 w-full"
            hoverScale={1.01}
            onClick={() => navigate({ to: '/create-organization' })}
            tapScale={0.99}
            type="button"
            variant="outline"
          >
            <PlusIcon />
            Adicionar organização
          </Button>
        </section>
      </div>
    </main>
  )
}
