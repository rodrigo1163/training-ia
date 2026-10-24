import { useState } from "react";
import { FileTextIcon, TypeIcon } from "lucide-react";

import { useUploadFileMutation } from "@/hooks/use-upload";
import { DocumentTextEditor } from "./document-text-editor";
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
  const mutation = useUploadFileMutation(orgSlug, botSlug);

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  async function handleUpload() {
    try {
      await mutation.mutateAsync({
        file: new File([text], "text.txt", { type: "text/plain" }),
      });
      toast.add({ title: "Text uploaded successfully.", type: "success" });
      setText("");
      setDialogOpen(false);
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Unable to upload the text.",
        type: "error",
      });
    }
  }

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
            onClick={() => void handleUpload()}
            type="button"
          >
            {mutation.isPending ? "Uploading..." : "Upload text"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
