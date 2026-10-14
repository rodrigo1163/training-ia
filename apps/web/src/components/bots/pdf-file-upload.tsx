import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import { botsQueryKey } from "@/components/bots/bots";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  formatBytes,
  type FileWithPreview,
  useFileUpload,
} from "@/hooks/use-file-upload";
import { extractPdfText } from "@/lib/extract-pdf-text";

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
  text: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-pdf-bot`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível enviar o PDF.");
  }

  const payload = (await response.json()) as UploadPdfResponse;

  if (!payload.documentId) {
    throw new Error("O backend não confirmou o upload do PDF.");
  }

  return payload;
}

async function uploadPdfs(
  orgSlug: string,
  botSlug: string,
  files: File[],
  texts: string[],
) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  for (const text of texts) {
    formData.append("texts", text);
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
    throw new Error("NÃ£o foi possÃ­vel enviar os PDFs.");
  }

  const payload = (await response.json()) as UploadPdfsResponse;

  if (!payload.documentIds || payload.documentIds.length !== files.length) {
    throw new Error("O backend nÃ£o confirmou o upload dos PDFs.");
  }

  return payload;
}

type PdfFileUploadProps = {
  orgSlug: string;
  botSlug: string;
};

type PdfExtractionState =
  | {
      status: "extracting";
      progress: number;
    }
  | {
      status: "ready";
      progress: 100;
      text: string;
    }
  | {
      status: "error";
      progress: number;
      error: string;
    };

const extractionErrorMessage = "Não foi possível extrair o texto deste PDF.";

export function PdfFileUpload({
  orgSlug,
  botSlug,
}: PdfFileUploadProps) {
  const [open, setOpen] = useState(false);
  const [extractionStates, setExtractionStates] = useState<
    Record<string, PdfExtractionState>
  >({});
  const extractionTokens = useRef(new Map<string, symbol>());
  const queryClient = useQueryClient();

  const handleFilesAdded = useCallback((addedFiles: FileWithPreview[]) => {
    setExtractionStates((previousStates) => {
      const nextStates = { ...previousStates };

      for (const selectedFile of addedFiles) {
        nextStates[selectedFile.id] = {
          progress: 0,
          status: "extracting",
        };
      }

      return nextStates;
    });

    for (const selectedFile of addedFiles) {
      if (!(selectedFile.file instanceof File)) {
        continue;
      }

      const extractionToken = Symbol(selectedFile.id);
      extractionTokens.current.set(selectedFile.id, extractionToken);

      const isCurrentExtraction = () =>
        extractionTokens.current.get(selectedFile.id) === extractionToken;

      void extractPdfText(selectedFile.file, (progress) => {
        if (!isCurrentExtraction()) {
          return;
        }

        setExtractionStates((previousStates) => {
          const currentState = previousStates[selectedFile.id];

          if (!currentState || currentState.status !== "extracting") {
            return previousStates;
          }

          return {
            ...previousStates,
            [selectedFile.id]: {
              progress,
              status: "extracting",
            },
          };
        });
      })
        .then((text) => {
          if (!isCurrentExtraction()) {
            return;
          }

          console.log("[PDF extraction]", {
            fileName: selectedFile.file.name,
            hasNullByte: text.includes("\u0000"),
            text,
          });

          if (text.trim().length === 0) {
            setExtractionStates((previousStates) => ({
              ...previousStates,
              [selectedFile.id]: {
                error: extractionErrorMessage,
                progress: previousStates[selectedFile.id]?.progress ?? 0,
                status: "error",
              },
            }));
            return;
          }

          setExtractionStates((previousStates) => ({
            ...previousStates,
            [selectedFile.id]: {
              progress: 100,
              status: "ready",
              text,
            },
          }));
        })
        .catch(() => {
          if (!isCurrentExtraction()) {
            return;
          }

          setExtractionStates((previousStates) => ({
            ...previousStates,
            [selectedFile.id]: {
              error: extractionErrorMessage,
              progress: previousStates[selectedFile.id]?.progress ?? 0,
              status: "error",
            },
          }));
        });
    }
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

  const isExtracting = files.some(
    (selectedFile) =>
      !extractionStates[selectedFile.id] ||
      extractionStates[selectedFile.id].status === "extracting",
  );
  const hasExtractionError = files.some(
    (selectedFile) => extractionStates[selectedFile.id]?.status === "error",
  );

  function clearSelection() {
    extractionTokens.current.clear();
    setExtractionStates({});
    clearFiles();
  }

  function closeAfterUpload() {
    setOpen(false);
    clearSelection();
  }

  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      texts,
    }: {
      files: File[];
      texts: string[];
    }) => {
      if (files.length === 1) {
        return uploadPdf(orgSlug, botSlug, files[0], texts[0]);
      }

      return uploadPdfs(orgSlug, botSlug, files, texts);
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
        title: "PDFs enviados com sucesso.",
        type: "success",
      });
      closeAfterUpload();
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (uploadMutation.isPending || isExtracting)) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      clearSelection();
    }
  }

  function handleRemoveFile(id: string) {
    extractionTokens.current.delete(id);
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
    const texts: string[] = [];

    for (const selectedFile of files) {
      const file = selectedFile.file;
      const extraction = extractionStates[selectedFile.id];

      if (
        !(file instanceof File) ||
        !extraction ||
        extraction.status !== "ready"
      ) {
        return;
      }

      selectedFiles.push(file);
      texts.push(extraction.text);
    }

    uploadMutation.mutate({ files: selectedFiles, texts });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UploadIcon className="size-4 opacity-60" />
          Uploads PDFs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uploads PDFs</DialogTitle>
          <DialogDescription>
            Selecione atÃ© 5 arquivos PDF para usar como dados do bot.
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
                <p className="mb-1.5 text-sm font-medium">Upload de PDF</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Arraste ou clique para selecionar
                </p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>Apenas PDF</span>
                  <span>∙</span>
                  <span>Até {formatBytes(MAX_SIZE)}</span>
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
                            <p className="text-xs text-destructive" role="alert">
                              {extractionState.error}
                            </p>
                          ) : (
                            <div className="mt-1 flex items-center gap-2">
                              <Progress
                                aria-label={`Progresso da extração de ${selectedFile.file.name}`}
                                className="flex-1"
                                value={extractionState?.progress ?? 0}
                              />
                              <span className="w-9 text-right text-xs text-muted-foreground">
                                {extractionState?.progress ?? 0}
                                %
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

        <DialogFooter>
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
              ? "Lendo PDFs..."
              : uploadMutation.isPending
                ? "Enviando..."
                : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
