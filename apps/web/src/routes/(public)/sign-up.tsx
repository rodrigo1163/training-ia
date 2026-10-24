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
import { PasswordInput } from './-components/password-input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@training-ia/ui/components/ui/field'
import { Input } from '@training-ia/ui/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { resolveOrganizationHome } from '@/lib/resolve-organization-home'

const signUpSchema = z.object({
  name: z.string().trim().min(2, { error: 'Enter your name.' }),
  email: z.email({ error: 'Enter a valid email address.' }),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters.' }),
})

type SignUpValues = z.infer<typeof signUpSchema>

export const Route = createFileRoute('/(public)/sign-up')({
  head: () => ({ meta: [{ title: 'Create account | Training IA' }] }),
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const result = await authClient.signUp.email(values)

      if (result.error) {
        throw new Error(result.error.message ?? 'Unable to authenticate.')
      }

      return result.data
    },
    onSuccess: async () => {
      await navigate(await resolveOrganizationHome())
    },
  })

  function onSubmit(values: SignUpValues) {
    signUpMutation.mutate(values)
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
              New account
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Create your access
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Fill in your details to get started.
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
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="name"
                      className="h-11"
                      id={field.name}
                      placeholder="Your name"
                      type="text"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                      className="h-11"
                      id={field.name}
                      placeholder="At least 8 characters"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              {signUpMutation.error ? (
                <FieldError>{signUpMutation.error.message}</FieldError>
              ) : null}

              <Button
                className="h-11 w-full"
                disabled={signUpMutation.isPending}
                hoverScale={1.01}
                tapScale={0.99}
                type="submit"
              >
                {signUpMutation.isPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <ArrowRightIcon />
                )}
                {signUpMutation.isPending ? 'Please wait...' : 'Create account'}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              to="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
