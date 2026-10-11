import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";

const MAX_SIZE = 10 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

type PresignedUpload = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  documentId: string;
};

type PresignedUploadResponse = {
  value?: PresignedUpload;
};

async function uploadPdf(
  organizationSlug: string,
  botSlug: string,
  file: File,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(organizationSlug)}/bots/${encodeURIComponent(botSlug)}/upload-pdf-bot`,
    {
      body: JSON.stringify({
        contentType: file.type || "application/pdf",
        filename: file.name,
        size: file.size,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível preparar o upload do PDF.");
  }

  const payload = (await response.json()) as PresignedUploadResponse;
  const presignedUpload = payload.value;

  if (!presignedUpload?.uploadUrl) {
    throw new Error("O backend não retornou uma URL de upload válida.");
  }

  const uploadResponse = await fetch(presignedUpload.uploadUrl, {
    body: file,
    headers: presignedUpload.headers,
    method: presignedUpload.method,
  });

  if (!uploadResponse.ok) {
    throw new Error("Não foi possível enviar o PDF para o armazenamento.");
  }

  return presignedUpload;
}

type PdfFileUploadProps = {
  organizationSlug: string;
  botSlug: string;
};

export function PdfFileUpload({
  organizationSlug,
  botSlug,
}: PdfFileUploadProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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
    maxFiles: 1,
    maxSize: MAX_SIZE,
    multiple: false,
    replaceExisting: false,
  });

  function closeAfterUpload() {
    setOpen(false);
    clearFiles();
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadPdf(organizationSlug, botSlug, file),
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(organizationSlug, botSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(organizationSlug),
      });
      toast.add({
        title: "PDF enviado com sucesso.",
        type: "success",
      });
      closeAfterUpload();
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && uploadMutation.isPending) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      clearFiles();
    }
  }

  function handleSubmit() {
    const file = files[0]?.file;

    if (!(file instanceof File) || uploadMutation.isPending) {
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UploadIcon className="size-4 opacity-60" />
          Adicionar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar PDF</DialogTitle>
          <DialogDescription>
            Selecione um arquivo PDF para usar como dados do bot.
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
                aria-label="Adicionar PDF"
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

            {files[0] && (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                    <FileTextIcon className="size-4 opacity-60" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-medium">
                      {files[0].file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(files[0].file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  aria-label={`Remover ${files[0].file.name}`}
                  className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={() => removeFile(files[0].id)}
                  disabled={uploadMutation.isPending}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={files.length === 0 || uploadMutation.isPending}
            onClick={handleSubmit}
            type="button"
          >
            {uploadMutation.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
