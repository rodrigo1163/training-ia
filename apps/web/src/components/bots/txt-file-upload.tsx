import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { AlertCircleIcon, FileTextIcon, FileUpIcon, UploadIcon, XIcon } from "lucide-react";

import { botsQueryKey } from "@/components/bots/bots";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import { Button } from "@training-ia/ui/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@training-ia/ui/components/ui/dialog";
import { Progress } from "@training-ia/ui/components/ui/progress";
import { toast } from "@training-ia/ui/components/ui/toast";
import { formatBytes, type FileWithPreview, useFileUpload } from "@/hooks/use-file-upload";

const MAX_SIZE = 10 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

async function uploadTxt(orgSlug: string, botSlug: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-txt-bot`, { body: formData, credentials: "include", method: "POST" });
  if (!response.ok) throw new Error("Unable to upload the TXT.");
  const payload = (await response.json()) as { documentId?: string };
  if (!payload.documentId) throw new Error("The backend did not confirm the TXT upload.");
  return payload;
}

async function uploadTxts(orgSlug: string, botSlug: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await fetch(`${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-txts-bot`, { body: formData, credentials: "include", method: "POST" });
  if (!response.ok) throw new Error("Unable to upload the TXTs.");
  const payload = (await response.json()) as { documentIds?: string[] };
  if (!payload.documentIds || payload.documentIds.length !== files.length) throw new Error("The backend did not confirm the TXT uploads.");
  return payload;
}

type TxtFileUploadProps = { orgSlug: string; botSlug: string; onTrigger?: () => void; open?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean };

export function TxtFileUpload({ orgSlug, botSlug, onTrigger, open: controlledOpen, onOpenChange, hideTrigger = false }: TxtFileUploadProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const queryClient = useQueryClient();

  const [{ isDragging, errors }, actions] = useFileUpload({
    accept: "text/plain,.txt",
    maxFiles: 5,
    maxSize: MAX_SIZE,
    multiple: true,
    onFilesAdded: useCallback((added: FileWithPreview[]) => setFiles((current) => [...current, ...added]), []),
  });

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function clearSelection() {
    setFiles([]);
    actions.clearFiles();
  }

  const mutation = useMutation({
    mutationFn: async ({ selected }: { selected: File[] }) => selected.length === 1 ? uploadTxt(orgSlug, botSlug, selected[0]) : uploadTxts(orgSlug, botSlug, selected),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fetchDataQueryKey(orgSlug, botSlug) });
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
      toast.add({ title: "TXTs uploaded successfully.", type: "success" });
      setDialogOpen(false);
      clearSelection();
    },
  });

  function submit() {
    if (!files.length || mutation.isPending) return;
    const selected = files.flatMap((item) => item.file instanceof File ? [item.file] : []);
    if (selected.length !== files.length) return;
    mutation.mutate({ selected });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && mutation.isPending) return; setDialogOpen(next); if (!next) clearSelection(); }}>
      {!hideTrigger && <DialogTrigger asChild><Button onClick={onTrigger} type="button" variant="outline"><UploadIcon className="size-4 opacity-60" />Uploads TXT</Button></DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>TXT uploads</DialogTitle><DialogDescription>Select up to 5 TXT files to use as bot data.</DialogDescription></DialogHeader>
        <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4"><div className="flex flex-col gap-2">
          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 hover:bg-accent/50" data-dragging={isDragging || undefined} onClick={() => !mutation.isPending && actions.openFileDialog()} onDragEnter={actions.handleDragEnter} onDragLeave={actions.handleDragLeave} onDragOver={actions.handleDragOver} onDrop={actions.handleDrop} role="button" tabIndex={-1}>
            <input {...actions.getInputProps()} aria-label="Uploads TXT" className="sr-only" disabled={mutation.isPending} />
            <div className="flex flex-col items-center text-center"><div className="mb-2 flex size-11 items-center justify-center rounded-full border bg-background"><FileUpIcon className="size-4 opacity-60" /></div><p className="mb-1.5 text-sm font-medium">TXT upload</p><p className="mb-2 text-xs text-muted-foreground">Drag or click to select</p><div className="flex gap-1 text-xs text-muted-foreground/70"><span>TXT only</span><span>•</span><span>Up to {formatBytes(MAX_SIZE)}</span></div></div>
          </div>
          {errors.length > 0 && <div className="flex items-center gap-1 text-xs text-destructive" role="alert"><AlertCircleIcon className="size-3" /><span>{errors[0]}</span></div>}
          {files.map((item) => <div className="flex items-start justify-between gap-2 rounded-lg border bg-background p-2 pe-3" key={item.id}><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded border"><FileTextIcon className="size-4 opacity-60" /></div><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{item.file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p><div className="mt-1 flex items-center gap-2"><Progress className="flex-1" value={100} /><span className="w-9 text-right text-xs text-muted-foreground">100%</span></div></div></div><Button aria-label={`Remover ${item.file.name}`} className="-me-2 size-8" disabled={mutation.isPending} onClick={() => { actions.removeFile(item.id); setFiles((current) => current.filter((file) => file.id !== item.id)); }} size="icon" type="button" variant="ghost"><XIcon className="size-4" /></Button></div>)}
        </div></div>
        <DialogFooter><Button disabled={!files.length || mutation.isPending} onClick={submit} type="button">{mutation.isPending ? "Uploading..." : "Upload"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
