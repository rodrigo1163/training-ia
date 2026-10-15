import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PlusIcon } from "lucide-react";

import { botsQueryKey, createBot } from "@/components/bots/bots";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@training-ia/ui/components/ui/dialog";
import { Input } from "@training-ia/ui/components/ui/input";
import { Label } from "@training-ia/ui/components/ui/label";
import { toast } from "@training-ia/ui/components/ui/toast";

export function CreateBotDialog({
  orgSlug,
}: {
  orgSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const normalizedName = name.trim();

  const mutation = useMutation({
    mutationFn: () => createBot(orgSlug, normalizedName),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async (bot) => {
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(orgSlug),
      });
      setOpen(false);
      setName("");
      toast.add({ title: "Bot criado com sucesso.", type: "success" });
      await navigate({
        to: "/org/$orgSlug/bots/$botSlug",
        params: { orgSlug, botSlug: bot.slug },
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedName.length < 2 || normalizedName.length > 80) return;
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon aria-hidden="true" />
          Criar bot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar bot</DialogTitle>
            <DialogDescription>
              Dê um nome ao bot. O endereço será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="bot-name">Nome</Label>
            <Input
              autoFocus
              disabled={mutation.isPending}
              id="bot-name"
              maxLength={80}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Atendimento"
              required
              value={name}
            />
            <p className="text-xs text-muted-foreground">2 a 80 caracteres.</p>
          </div>
          <DialogFooter>
            <Button
              disabled={
                mutation.isPending ||
                normalizedName.length < 2 ||
                normalizedName.length > 80
              }
              type="submit"
            >
              {mutation.isPending ? "Criando..." : "Criar bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
