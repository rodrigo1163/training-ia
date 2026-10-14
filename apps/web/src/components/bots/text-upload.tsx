import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileTextIcon, TypeIcon } from "lucide-react";

import { botsQueryKey } from "@/components/bots/bots";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

async function uploadText(orgSlug: string, botSlug: string, text: string) {
  const file = new File([text], "text.txt", { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-txt-bot`,
    { body: formData, credentials: "include", method: "POST" },
  );

  if (!response.ok) throw new Error("Não foi possível enviar o texto.");

  const payload = (await response.json()) as { documentId?: string };
  if (!payload.documentId) {
    throw new Error("O backend não confirmou o upload do texto.");
  }
}

export function TextUpload({
  orgSlug,
  botSlug,
  onTrigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  orgSlug: string;
  botSlug: string;
  onTrigger?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const mutation = useMutation({
    mutationFn: () => uploadText(orgSlug, botSlug, text),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
      toast.add({ title: "Texto enviado com sucesso.", type: "success" });
      setText("");
      setDialogOpen(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return;
    setDialogOpen(nextOpen);
    if (!nextOpen) setText("");
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button onClick={onTrigger} type="button" variant="outline">
            <TypeIcon className="size-4 opacity-60" />
            Upload de texto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="min-h-[520px] max-h-[calc(100dvh-2rem)] max-w-4xl gap-4 overflow-hidden p-6 sm:max-h-[calc(100dvh-4rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload de texto</DialogTitle>
          <DialogDescription>
            Digite ou cole o texto que será usado como dado do bot.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileTextIcon className="size-4 opacity-60" />
            Conteúdo do texto
          </div>
          <Textarea
            aria-label="Conteúdo do texto"
            autoFocus
            className="min-h-72 resize-y"
            disabled={mutation.isPending}
            onChange={(event) => setText(event.target.value)}
            placeholder="Digite ou cole seu texto aqui..."
            value={text}
          />
          {text.length > 0 && (
            <p className="text-right text-xs text-muted-foreground">
              {text.length.toLocaleString("pt-BR")} caracteres
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!text.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? "Enviando..." : "Enviar texto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
