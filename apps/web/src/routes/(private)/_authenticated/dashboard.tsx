import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute(
  '/(private)/_authenticated/dashboard',
)({
  head: () => ({ meta: [{ title: 'Área privada | Training IA' }] }),
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut()

      if (result.error) {
        throw new Error(result.error.message ?? 'Não foi possível sair.')
      }
    },
    onSuccess: async () => {
      queryClient.clear()
      await navigate({ to: '/sign-in' })
    },
  })

  function handleSignOut() {
    signOutMutation.mutate()
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#f5f5f2] px-4">
      <section className="w-full max-w-lg border-l-4 border-[#164e3f] bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase text-[#b45309]">
          Área privada
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">
          Os pixels estão em treinamento.
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#646964]">
          Esta rota existe, está protegida e ainda não tem mais nada por aqui.
        </p>
        <Button
          className="mt-7"
          disabled={signOutMutation.isPending}
          onClick={handleSignOut}
          variant="outline"
        >
          <LogOutIcon />
          {signOutMutation.isPending ? 'Saindo...' : 'Sair'}
        </Button>
        {signOutMutation.error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {signOutMutation.error.message}
          </p>
        ) : null}
      </section>
    </main>
  )
}
