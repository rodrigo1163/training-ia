import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
import { authClient } from '@/lib/auth-client'
import { slugify, withIncrementalSlug } from '@/lib/slugify'

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, { error: 'Informe o nome da organização.' }),
})

type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>

const MAX_SLUG_ATTEMPTS = 100

export const Route = createFileRoute('/(private)/create-organization')({
  head: () => ({ meta: [{ title: 'Criar organização | Training IA' }] }),
  component: CreateOrganizationPage,
})

async function createOrganizationWithUniqueSlug(name: string) {
  const baseSlug = slugify(name)

  for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n += 1) {
    const slug = withIncrementalSlug(baseSlug, n)

    const result = await authClient.organization.create({
      name,
      slug,
    })

    if (!result.error) {
      if (!result.data) {
        throw new Error('Não foi possível criar a organização.')
      }

      return result.data
    }

    const isSlugTaken =
      result.error.code === 'ORGANIZATION_ALREADY_EXISTS' ||
      result.error.code === 'ORGANIZATION_SLUG_ALREADY_TAKEN' ||
      result.error.message?.toLowerCase().includes('already exists') ||
      result.error.message?.toLowerCase().includes('slug')

    if (!isSlugTaken) {
      throw new Error(
        result.error.message ?? 'Não foi possível criar a organização.',
      )
    }
  }

  throw new Error('Não foi possível criar a organização.')
}

function CreateOrganizationPage() {
  const navigate = useNavigate()

  const form = useForm<CreateOrganizationValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
    },
  })

  const createOrganizationMutation = useMutation({
    mutationFn: async (values: CreateOrganizationValues) => {
      return createOrganizationWithUniqueSlug(values.name)
    },
    onSuccess: async (organization) => {
      await navigate({
        to: '/org/$orgSlug/dashboard',
        params: { orgSlug: organization.slug },
      })
    },
  })

  function onSubmit(values: CreateOrganizationValues) {
    createOrganizationMutation.mutate(values)
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
              Organização
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Crie sua organização
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Você precisa de uma organização para acessar o painel.
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
                    <FieldLabel htmlFor={field.name}>
                      Nome da organização
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="organization"
                      className="h-11"
                      id={field.name}
                      placeholder="Minha empresa"
                      type="text"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              {createOrganizationMutation.error ? (
                <FieldError>
                  {createOrganizationMutation.error.message}
                </FieldError>
              ) : null}

              <Button
                className="h-11 w-full"
                disabled={createOrganizationMutation.isPending}
                hoverScale={1.01}
                tapScale={0.99}
                type="submit"
              >
                {createOrganizationMutation.isPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <ArrowRightIcon />
                )}
                {createOrganizationMutation.isPending
                  ? 'Aguarde...'
                  : 'Criar organização'}
              </Button>
            </FieldGroup>
          </form>
        </section>
      </div>
    </main>
  )
}
