import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import {
  botQueryKey,
  botsQueryKey,
  updateBot,
  type Bot,
} from '@/hooks/use-bots'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  systemPrompt: z.string().trim().min(1).max(8000),
})

type FormValues = z.infer<typeof schema>

export function BotBehaviorForm({
  organizationId,
  bot,
}: {
  organizationId: string
  bot: Bot
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: bot.name,
      description: bot.description ?? '',
      systemPrompt: bot.systemPrompt,
    },
  })

  useEffect(() => {
    form.reset({
      name: bot.name,
      description: bot.description ?? '',
      systemPrompt: bot.systemPrompt,
    })
  }, [bot, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateBot(organizationId, bot.id, {
        name: values.name,
        description: values.description.trim() || null,
        systemPrompt: values.systemPrompt,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: botQueryKey(organizationId, bot.id),
        }),
        queryClient.invalidateQueries({
          queryKey: botsQueryKey(organizationId),
        }),
      ])
      toast.add({ title: 'Bot atualizado', type: 'success' })
    },
    onError: (error) => {
      toast.add({
        title:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o bot.',
        type: 'error',
      })
    },
  })

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={3} {...form.register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System prompt</Label>
        <Textarea
          id="systemPrompt"
          rows={8}
          {...form.register('systemPrompt')}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Modelo de chat: {bot.chatModel}
      </p>

      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : null}
        Salvar
      </Button>
    </form>
  )
}
