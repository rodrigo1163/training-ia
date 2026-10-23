import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FileUpIcon,
  LoaderCircleIcon,
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
import { toast } from "@training-ia/ui/components/ui/toast";

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

type UploadFileResponse = {
  documentId?: string;
};

export type FileUploadStatus = "ready" | "uploading" | "success" | "error";

export type FileUploadState = {
  status: FileUploadStatus;
  error?: string;
};

type UploadResult = {
  id: string;
  status: "success" | "error";
  error?: string;
};

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  return "Unable to upload the file.";
}

async function getResponseError(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };

    if (typeof payload.message === "string") return payload.message;

    if (
      Array.isArray(payload.message) &&
      payload.message.every(
        (message): message is string => typeof message === "string",
      )
    ) {
      return payload.message.join(", ");
    }

    if (typeof payload.error === "string") return payload.error;
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function uploadBotFile(
  orgSlug: string,
  botSlug: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-file`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getResponseError(response, `Unable to upload "${file.name}".`),
    );
  }

  const payload = (await response.json()) as UploadFileResponse;

  if (!payload.documentId) {
    throw new Error(`The backend did not confirm "${file.name}" upload.`);
  }
}

type FileUploadProps = {
  orgSlug: string;
  botSlug: string;
  onTrigger?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function FileUpload({
  orgSlug,
  botSlug,
  onTrigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: FileUploadProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [uploadStates, setUploadStates] = useState<
    Record<string, FileUploadState>
  >({});
  const queryClient = useQueryClient();
  const open = controlledOpen ?? internalOpen;

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const handleFilesAdded = useCallback((addedFiles: FileWithPreview[]) => {
    setUploadStates((previousStates) => {
      const nextStates = { ...previousStates };

      for (const selectedFile of addedFiles) {
        nextStates[selectedFile.id] = { status: "ready" };
      }

      return nextStates;
    });
  }, []);

  const [
    { files, isDragging, errors },
    {
      clearFiles,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
    },
  ] = useFileUpload({
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    multiple: true,
    onFilesAdded: handleFilesAdded,
  });

  function clearSelection() {
    setUploadStates({});
    clearFiles();
  }

  function closeAfterUpload() {
    setDialogOpen(false);
    clearSelection();
  }

  const uploadMutation = useMutation({
    mutationFn: async (selectedFiles: Array<{ file: File; id: string }>) => {
      setUploadStates((previousStates) => {
        const nextStates = { ...previousStates };

        for (const selectedFile of selectedFiles) {
          nextStates[selectedFile.id] = { status: "uploading" };
        }

        return nextStates;
      });

      return Promise.all(
        selectedFiles.map(async ({ file, id }): Promise<UploadResult> => {
          try {
            await uploadBotFile(orgSlug, botSlug, file);
            return { id, status: "success" };
          } catch (error) {
            return { id, error: getErrorMessage(error), status: "error" };
          }
        }),
      );
    },
    onError: (error) => {
      toast.add({ title: error.message, type: "error" });
    },
    onSuccess: async (results) => {
      setUploadStates((previousStates) => {
        const nextStates = { ...previousStates };

        for (const result of results) {
          nextStates[result.id] = {
            error: result.error,
            status: result.status,
          };
        }

        return nextStates;
      });

      const successfulUploads = results.filter(
        (result) => result.status === "success",
      ).length;
      const failedUploads = results.length - successfulUploads;

      if (successfulUploads > 0) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: fetchDataQueryKey(orgSlug, botSlug),
          }),
          queryClient.invalidateQueries({
            queryKey: botsQueryKey(orgSlug),
          }),
        ]);
      }

      if (failedUploads === 0) {
        toast.add({
          title: "Files uploaded successfully.",
          type: "success",
        });
        closeAfterUpload();
        return;
      }

      toast.add({
        title: `${failedUploads} file(s) could not be uploaded.`,
        type: "error",
      });
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && uploadMutation.isPending) return;

    setDialogOpen(nextOpen);
    if (!nextOpen) clearSelection();
  }

  function handleRemoveFile(id: string) {
    setUploadStates((previousStates) => {
      const nextStates = { ...previousStates };
      delete nextStates[id];
      return nextStates;
    });
    removeFile(id);
  }

  function handleSubmit() {
    if (uploadMutation.isPending) return;

    const selectedFiles: Array<{ file: File; id: string }> = [];

    for (const selectedFile of files) {
      const file = selectedFile.file;
      const state = uploadStates[selectedFile.id];

      if (!(file instanceof File) || state?.status === "success") continue;

      selectedFiles.push({ file, id: selectedFile.id });
    }

    if (selectedFiles.length === 0) return;

    uploadMutation.mutate(selectedFiles);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button onClick={onTrigger} type="button" variant="outline">
            <UploadIcon className="size-4 opacity-60" />
            Upload files
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Select up to {MAX_FILES} PDF, DOC, DOCX or TXT files to use as bot
            data.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 data-[dragging=true]:bg-accent/50"
              data-dragging={isDragging || undefined}
              onClick={() => {
                if (!uploadMutation.isPending) openFileDialog();
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
                aria-label="Upload files"
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
                <p className="mb-1.5 text-sm font-medium">File upload</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Drag or click to select
                </p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>PDF, DOC, DOCX or TXT</span>
                  <span>•</span>
                  <span>Up to {formatBytes(MAX_SIZE)} per file</span>
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
                  const fileState = uploadStates[selectedFile.id] ?? {
                    status: "ready" as const,
                  };
                  const isUploading = fileState.status === "uploading";
                  const isSuccess = fileState.status === "success";

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

                          {isUploading && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <LoaderCircleIcon className="size-3 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          )}

                          {isSuccess && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-success">
                              <CheckCircle2Icon className="size-3" />
                              <span>Uploaded successfully</span>
                            </div>
                          )}

                          {fileState.status === "error" && (
                            <p
                              className="mt-1 text-xs text-destructive"
                              role="alert"
                            >
                              {fileState.error}
                            </p>
                          )}

                          {fileState.status === "ready" && (
                            <span className="mt-1 text-xs text-muted-foreground">
                              Ready to upload
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        aria-label={`Remove ${selectedFile.file.name}`}
                        className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                        disabled={uploadMutation.isPending}
                        onClick={() => handleRemoveFile(selectedFile.id)}
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
              files.every(
                (selectedFile) =>
                  uploadStates[selectedFile.id]?.status === "success",
              )
            }
            onClick={handleSubmit}
            type="button"
          >
            {uploadMutation.isPending
              ? "Uploading..."
              : files.some(
                    (selectedFile) =>
                      uploadStates[selectedFile.id]?.status === "error",
                  )
                ? "Retry failed files"
                : "Upload files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
