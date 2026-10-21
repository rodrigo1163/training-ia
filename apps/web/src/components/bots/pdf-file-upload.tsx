import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@training-ia/ui/components/ui/button";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import { botsQueryKey } from "@/components/bots/bots";
import { Progress } from "@training-ia/ui/components/ui/progress";
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
import {
  formatBytes,
  type FileWithPreview,
  useFileUpload,
} from "@/hooks/use-file-upload";

const MAX_SIZE = 10 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

type UploadPdfResponse = {
  documentId?: string;
};

type UploadPdfsResponse = {
  documentIds?: string[];
};

async function uploadPdf(
  orgSlug: string,
  botSlug: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-pdf-bot`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to upload the PDF.");
  }

  const payload = (await response.json()) as UploadPdfResponse;

  if (!payload.documentId) {
    throw new Error("The backend did not confirm the PDF upload.");
  }

  return payload;
}

async function uploadPdfs(
  orgSlug: string,
  botSlug: string,
  files: File[],
) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-pdfs-bot`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to upload the PDFs.");
  }

  const payload = (await response.json()) as UploadPdfsResponse;

  if (!payload.documentIds || payload.documentIds.length !== files.length) {
    throw new Error("The backend did not confirm the PDF uploads.");
  }

  return payload;
}

type PdfFileUploadProps = {
  orgSlug: string;
  botSlug: string;
  onTrigger?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

type PdfExtractionState =
  | { status: "ready"; progress: 100 }
  | {
      status: "error";
      progress: number;
      error: string;
    };

export function PdfFileUpload({
  orgSlug,
  botSlug,
  onTrigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: PdfFileUploadProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [extractionStates, setExtractionStates] = useState<
    Record<string, PdfExtractionState>
  >({});
  const queryClient = useQueryClient();

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const handleFilesAdded = useCallback((addedFiles: FileWithPreview[]) => {
    setExtractionStates((previousStates) => {
      const nextStates = { ...previousStates };

      for (const selectedFile of addedFiles) {
        nextStates[selectedFile.id] = { progress: 100, status: "ready" };
      }

      return nextStates;
    });

  }, []);

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "application/pdf,.pdf",
    maxFiles: 5,
    maxSize: MAX_SIZE,
    multiple: true,
    onFilesAdded: handleFilesAdded,
  });

  const isExtracting = false;
  const hasExtractionError = false;

  function clearSelection() {
    setExtractionStates({});
    clearFiles();
  }

  function closeAfterUpload() {
    setDialogOpen(false);
    clearSelection();
  }

  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
    }: { files: File[] }) => {
      if (files.length === 1) {
        return uploadPdf(orgSlug, botSlug, files[0]);
      }

      return uploadPdfs(orgSlug, botSlug, files);
    },
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(orgSlug),
      });
      toast.add({
        title: "PDFs uploaded successfully.",
        type: "success",
      });
      closeAfterUpload();
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (uploadMutation.isPending || isExtracting)) {
      return;
    }

    setDialogOpen(nextOpen);
    if (!nextOpen) {
      clearSelection();
    }
  }

  function handleRemoveFile(id: string) {
    setExtractionStates((previousStates) => {
      const nextStates = { ...previousStates };
      delete nextStates[id];
      return nextStates;
    });
    removeFile(id);
  }

  function handleSubmit() {
    if (
      files.length === 0 ||
      uploadMutation.isPending ||
      isExtracting ||
      hasExtractionError
    ) {
      return;
    }

    const selectedFiles: File[] = [];
    for (const selectedFile of files) {
      const file = selectedFile.file;
      if (!(file instanceof File)) {
        return;
      }

      selectedFiles.push(file);
    }

    uploadMutation.mutate({ files: selectedFiles });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button onClick={onTrigger} type="button" variant="outline">
            <UploadIcon className="size-4 opacity-60" />
            Uploads PDFs
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uploads PDFs</DialogTitle>
          <DialogDescription>
            Select up to 5 PDF files to use as bot data.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 data-[dragging=true]:bg-accent/50"
              data-dragging={isDragging || undefined}
              onClick={() => {
                if (!uploadMutation.isPending) {
                  openFileDialog();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="button"
              tabIndex={-1}
            >
              <input
                {...getInputProps()}
                aria-label="Uploads PDFs"
                className="sr-only"
                disabled={uploadMutation.isPending}
              />

              <div className="flex flex-col items-center justify-center text-center">
                <div
                  aria-hidden="true"
                  className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                >
                  <FileUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">PDF upload</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Drag or click to select
                </p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>PDF only</span>
                  <span>∙</span>
                  <span>Up to {formatBytes(MAX_SIZE)}</span>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-destructive"
                role="alert"
              >
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>{errors[0]}</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                {files.map((selectedFile) => {
                  const extractionState = extractionStates[selectedFile.id];

                  return (
                    <div
                      className="flex items-start justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                      key={selectedFile.id}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                          <FileTextIcon className="size-4 opacity-60" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="truncate text-[13px] font-medium">
                            {selectedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(selectedFile.file.size)}
                          </p>
                          {extractionState?.status === "error" ? (
                            <p
                              className="text-xs text-destructive"
                              role="alert"
                            >
                              {extractionState.error}
                            </p>
                          ) : (
                            <div className="mt-1 flex items-center gap-2">
                              <Progress
                                aria-label={`Extraction progress for ${selectedFile.file.name}`}
                                className="flex-1"
                                value={extractionState?.progress ?? 0}
                              />
                              <span className="w-9 text-right text-xs text-muted-foreground">
                                {extractionState?.progress ?? 0}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        aria-label={`Remover ${selectedFile.file.name}`}
                        className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                        onClick={() => handleRemoveFile(selectedFile.id)}
                        disabled={uploadMutation.isPending}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <XIcon aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-2 border-t border-border bg-muted/30 px-6 py-4">
          <Button
            disabled={
              files.length === 0 ||
              uploadMutation.isPending ||
              isExtracting ||
              hasExtractionError
            }
            onClick={handleSubmit}
            type="button"
          >
            {isExtracting
              ? "Reading PDFs..."
              : uploadMutation.isPending
                ? "Uploading..."
                : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
