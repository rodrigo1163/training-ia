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

import { formatBytes } from "../-helpers/file-format";
import { ButtonSpinner } from "@/components/button-spinner";
import { useFileUpload } from "../-hooks/use-file-upload";
import type { FileWithPreview } from "../-types/file-selector";
import type { FileUploadState, UploadResult } from "../-types/file-upload";
import { useUploadFileMutation } from "@/hooks/use-upload";
import { Button } from "@training-ia/ui/components/ui/button";
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

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt";
function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  return "Unable to upload the file.";
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
  const uploadFileMutation = useUploadFileMutation(orgSlug, botSlug);
  const [isUploading, setIsUploading] = useState(false);
  const open = controlledOpen ?? internalOpen;

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const handleFilesAdded = useCallback((addedFiles: FileWithPreview[]) => {
    setUploadStates((previousStates) => {
      const nextStates = { ...previousStates };

      for (const selectedFile of addedFiles) {
        nextStates[selectedFile.id] = { progress: 0, status: "ready" };
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

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isUploading) return;

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

  async function handleSubmit() {
    if (isUploading) return;

    const selectedFiles: Array<{ file: File; id: string }> = [];

    for (const selectedFile of files) {
      const file = selectedFile.file;
      const state = uploadStates[selectedFile.id];

      if (!(file instanceof File) || state?.status === "success") continue;

      selectedFiles.push({ file, id: selectedFile.id });
    }

    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStates((previousStates) => {
      const nextStates = { ...previousStates };
      for (const selectedFile of selectedFiles) {
        nextStates[selectedFile.id] = { progress: 0, status: "uploading" };
      }
      return nextStates;
    });

    const results = await Promise.all(
      selectedFiles.map(async ({ file, id }): Promise<UploadResult> => {
        try {
          await uploadFileMutation.mutateAsync({
            file,
            onProgress: (progress) => {
              setUploadStates((previousStates) => {
                const currentState = previousStates[id];
                if (!currentState || currentState.status !== "uploading") {
                  return previousStates;
                }
                return {
                  ...previousStates,
                  [id]: { ...currentState, progress },
                };
              });
            },
          });
          return { id, status: "success" };
        } catch (error) {
          return { id, error: getErrorMessage(error), status: "error" };
        }
      }),
    );

    setUploadStates((previousStates) => {
      const nextStates = { ...previousStates };
      for (const result of results) {
        nextStates[result.id] = {
          error: result.error,
          progress:
            result.status === "success"
              ? 100
              : (nextStates[result.id]?.progress ?? 0),
          status: result.status,
        };
      }
      return nextStates;
    });
    setIsUploading(false);

    const successfulUploads = results.filter(
      (result) => result.status === "success",
    ).length;
    const failedUploads = results.length - successfulUploads;
    if (failedUploads === 0) {
      toast.add({ title: "Files uploaded successfully.", type: "success" });
      closeAfterUpload();
      return;
    }

    toast.add({
      title: `${failedUploads} file(s) could not be uploaded.`,
      type: "error",
    });
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
                if (!isUploading) openFileDialog();
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
                disabled={isUploading}
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
                    progress: 0,
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
                            <div className="mt-1 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <LoaderCircleIcon className="size-3 animate-spin" />
                                  <span>Uploading...</span>
                                </div>
                                <span>{fileState.progress}%</span>
                              </div>
                              <Progress
                                aria-label={`Upload progress for ${selectedFile.file.name}`}
                                value={fileState.progress}
                              />
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
                        disabled={isUploading}
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
              isUploading ||
              files.every(
                (selectedFile) =>
                  uploadStates[selectedFile.id]?.status === "success",
              )
            }
            onClick={handleSubmit}
            type="button"
          >
            {isUploading
              ? "Uploading..."
              : files.some(
                    (selectedFile) =>
                      uploadStates[selectedFile.id]?.status === "error",
                  )
                ? "Retry failed files"
                : "Upload files"}
            {isUploading && <ButtonSpinner />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
