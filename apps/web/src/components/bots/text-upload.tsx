import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileTextIcon, TypeIcon } from "lucide-react";

import { botsQueryKey } from "@/components/bots/bots";
import { DocumentTextEditor } from "@/components/bots/document-text-editor";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
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
import { toast } from "@training-ia/ui/components/ui/toast";

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

  if (!response.ok) throw new Error("Unable to upload the text.");

  const payload = (await response.json()) as { documentId?: string };
  if (!payload.documentId) {
    throw new Error("The backend did not confirm the text upload.");
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
      toast.add({ title: "Text uploaded successfully.", type: "success" });
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
            Text upload
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="min-h-[520px] max-h-[calc(100dvh-2rem)] max-w-4xl gap-4 overflow-hidden p-6 sm:max-h-[calc(100dvh-4rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Text upload</DialogTitle>
          <DialogDescription>
            Type or paste the text to use as bot data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileTextIcon className="size-4 opacity-60" />
            Text content
          </div>
          <DocumentTextEditor
            hasEmptyTextError={false}
            isSaving={mutation.isPending}
            markdown={text}
            onChange={setText}
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
            {mutation.isPending ? "Uploading..." : "Upload text"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
