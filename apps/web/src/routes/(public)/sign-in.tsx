import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  LoaderCircleIcon,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'

const signInSchema = z.object({
  email: z.email({ error: 'Informe um email válido.' }),
  password: z
    .string()
    .min(8, { error: 'A senha deve ter no mínimo 8 caracteres.' }),
})

type SignInValues = z.infer<typeof signInSchema>

export const Route = createFileRoute('/(public)/sign-in')({
  head: () => ({ meta: [{ title: 'Entrar | Training IA' }] }),
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signInMutation = useMutation({
    mutationFn: async (values: SignInValues) => {
      const result = await authClient.signIn.email(values)

      if (result.error) {
        throw new Error(result.error.message ?? 'Não foi possível autenticar.')
      }

      return result.data
    },
    onSuccess: async () => {
      await navigate({ to: '/dashboard' })
    },
    onError: (error) => {
      toast.add({
        title: error.message,
        type: 'error',
      })
    },
  })

  function onSubmit(values: SignInValues) {
    signInMutation.mutate(values)
  }

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
              Bem-vindo de volta
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Entre na sua conta
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use seu email e senha para continuar.
            </p>
          </header>

          <form
            method="post"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup className="gap-5">
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      className="h-11"
                      id={field.name}
                      placeholder="voce@exemplo.com"
                      type="email"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password"
                      className="h-11"
                      id={field.name}
                      placeholder="Mínimo de 8 caracteres"
                      type="password"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Button
                className="h-11 w-full"
                disabled={signInMutation.isPending}
                hoverScale={1.01}
                tapScale={0.99}
                type="submit"
              >
                {signInMutation.isPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <ArrowRightIcon />
                )}
                {signInMutation.isPending ? 'Aguarde...' : 'Entrar'}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não possui uma conta?{' '}
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              to="/sign-up"
            >
              Criar conta
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
