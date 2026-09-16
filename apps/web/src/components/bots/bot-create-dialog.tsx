import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { botsQueryKey, createBot } from '@/hooks/use-bots'

export function BotCreateDialog({
  organizationId,
  orgSlug,
}: {
  organizationId: string
  orgSlug: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createBot(organizationId, {
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async (bot) => {
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(organizationId),
      })
      toast.add({ title: 'Bot criado', type: 'success' })
      setOpen(false)
      setName('')
      setDescription('')
      await navigate({
        to: '/org/$orgSlug/bots/$botId',
        params: { orgSlug, botId: bot.id },
      })
    },
    onError: (error) => {
      toast.add({
        title:
          error instanceof Error ? error.message : 'Não foi possível criar o bot.',
        type: 'error',
      })
    },
  })

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button">Novo bot</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar bot</DialogTitle>
          <DialogDescription>
            Defina um nome para começar. Você poderá ajustar o comportamento depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Nome</Label>
            <Input
              id="bot-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Suporte"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-description">Descrição</Label>
            <Textarea
              id="bot-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional"
              value={description}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
