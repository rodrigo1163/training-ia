import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { botsQueryKey } from "@/components/bots/bots";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import {
  formatBytes,
  type FileWithPreview,
  useFileUpload,
} from "@/hooks/use-file-upload";
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
import { Progress } from "@training-ia/ui/components/ui/progress";
import { toast } from "@training-ia/ui/components/ui/toast";

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const DOC_CONTENT_TYPE = "application/msword";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

async function throwUploadError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let message = fallbackMessage;

  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      message = payload.message;
    }
  } catch {
    // Keep the fallback message when the server response is not JSON.
  }

  throw new Error(message);
}

async function uploadDoc(orgSlug: string, botSlug: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-doc-bot`,
    { body: formData, credentials: "include", method: "POST" },
  );

  if (!response.ok) {
    return throwUploadError(response, "Unable to upload the DOC.");
  }

  const payload = (await response.json()) as { documentId?: string };

  if (!payload.documentId) {
    throw new Error("The backend did not confirm the DOC upload.");
  }
}

async function uploadDocs(orgSlug: string, botSlug: string, files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-docs-bot`,
    { body: formData, credentials: "include", method: "POST" },
  );

  if (!response.ok) {
    return throwUploadError(response, "Unable to upload the DOC files.");
  }

  const payload = (await response.json()) as { documentIds?: string[] };

  if (!payload.documentIds || payload.documentIds.length !== files.length) {
    throw new Error("The backend did not confirm the DOC uploads.");
  }
}

type DocFileUploadProps = {
  orgSlug: string;
  botSlug: string;
  onTrigger?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function DocFileUpload({
  orgSlug,
  botSlug,
  onTrigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: DocFileUploadProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const queryClient = useQueryClient();
  const open = controlledOpen ?? internalOpen;

  const [{ isDragging, errors }, actions] = useFileUpload({
    accept: `${DOC_CONTENT_TYPE},.doc`,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    multiple: true,
    onFilesAdded: useCallback(
      (addedFiles: FileWithPreview[]) =>
        setFiles((currentFiles) => [...currentFiles, ...addedFiles]),
      [],
    ),
  });

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  function clearSelection() {
    setFiles([]);
    actions.clearFiles();
  }

  const mutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      if (selectedFiles.length === 1) {
        return uploadDoc(orgSlug, botSlug, selectedFiles[0]);
      }

      return uploadDocs(orgSlug, botSlug, selectedFiles);
    },
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: fetchDataQueryKey(orgSlug, botSlug),
        }),
        queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) }),
      ]);
      toast.add({ title: "DOC files uploaded successfully.", type: "success" });
      setDialogOpen(false);
      clearSelection();
    },
  });

  function submit() {
    if (files.length === 0 || mutation.isPending) {
      return;
    }

    const selectedFiles = files.flatMap((item) =>
      item.file instanceof File ? [item.file] : [],
    );

    if (selectedFiles.length !== files.length) {
      return;
    }

    mutation.mutate(selectedFiles);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) {
      return;
    }

    setDialogOpen(nextOpen);

    if (!nextOpen) {
      clearSelection();
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button onClick={onTrigger} type="button" variant="outline">
            <UploadIcon className="size-4 opacity-60" />
            DOC upload
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>DOC upload</DialogTitle>
          <DialogDescription>
            Select up to 5 DOC files to use as bot data.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 data-[dragging=true]:bg-accent/50"
              data-dragging={isDragging || undefined}
              onClick={() => !mutation.isPending && actions.openFileDialog()}
              onDragEnter={actions.handleDragEnter}
              onDragLeave={actions.handleDragLeave}
              onDragOver={actions.handleDragOver}
              onDrop={actions.handleDrop}
              role="button"
              tabIndex={-1}
            >
              <input
                {...actions.getInputProps()}
                aria-label="DOC upload"
                className="sr-only"
                disabled={mutation.isPending}
              />
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex size-11 items-center justify-center rounded-full border bg-background">
                  <FileUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">DOC upload</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Drag or click to select
                </p>
                <div className="flex gap-1 text-xs text-muted-foreground/70">
                  <span>DOC only</span>
                  <span>•</span>
                  <span>Up to {formatBytes(MAX_SIZE)}</span>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-destructive"
                role="alert"
              >
                <AlertCircleIcon className="size-3" />
                <span>{errors[0]}</span>
              </div>
            )}

            {files.map((item) => (
              <div
                className="flex items-start justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                key={item.id}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded border">
                    <FileTextIcon className="size-4 opacity-60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress className="flex-1" value={100} />
                      <span className="w-9 text-right text-xs text-muted-foreground">
                        100%
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  aria-label={`Remove ${item.file.name}`}
                  className="-me-2 size-8"
                  disabled={mutation.isPending}
                  onClick={() => {
                    actions.removeFile(item.id);
                    setFiles((currentFiles) =>
                      currentFiles.filter((file) => file.id !== item.id),
                    );
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={files.length === 0 || mutation.isPending}
            onClick={submit}
            type="button"
          >
            {mutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
