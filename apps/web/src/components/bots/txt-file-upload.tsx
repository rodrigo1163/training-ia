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
import { readTxtText } from "@/lib/read-txt-text";

const MAX_SIZE = 10 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

type TxtExtractionState =
  | { status: "reading"; progress: number }
  | { status: "ready"; progress: 100; text: string }
  | { status: "error"; progress: number; error: string };

async function uploadTxt(
  orgSlug: string,
  botSlug: string,
  file: File,
  text: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-txt-bot`,
    { body: formData, credentials: "include", method: "POST" },
  );
  if (!response.ok) throw new Error("Não foi possível enviar o TXT.");
  const payload = (await response.json()) as { documentId?: string };
  if (!payload.documentId)
    throw new Error("O backend não confirmou o upload do TXT.");
  return payload;
}

async function uploadTxts(
  orgSlug: string,
  botSlug: string,
  files: File[],
  texts: string[],
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  texts.forEach((text) => formData.append("texts", text));
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-txts-bot`,
    { body: formData, credentials: "include", method: "POST" },
  );
  if (!response.ok) throw new Error("Não foi possível enviar os TXTs.");
  const payload = (await response.json()) as { documentIds?: string[] };
  if (!payload.documentIds || payload.documentIds.length !== files.length)
    throw new Error("O backend não confirmou o upload dos TXTs.");
  return payload;
}

export function TxtFileUpload({
  orgSlug,
  botSlug,
}: {
  orgSlug: string;
  botSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, TxtExtractionState>>({});
  const tokens = useRef(new Map<string, symbol>());
  const queryClient = useQueryClient();
  const handleFilesAdded = useCallback((added: FileWithPreview[]) => {
    for (const selected of added) {
      if (!(selected.file instanceof File)) continue;
      const token = Symbol(selected.id);
      tokens.current.set(selected.id, token);
      setStates((current) => ({
        ...current,
        [selected.id]: { status: "reading", progress: 0 },
      }));
      void readTxtText(selected.file, (progress) => {
        if (tokens.current.get(selected.id) !== token) return;
        setStates((current) => ({
          ...current,
          [selected.id]: { status: "reading", progress },
        }));
      })
        .then((text) => {
          if (tokens.current.get(selected.id) !== token) return;
          setStates((current) => ({
            ...current,
            [selected.id]: text.trim()
              ? { status: "ready", progress: 100, text }
              : { status: "error", progress: 100, error: "O TXT está vazio." },
          }));
        })
        .catch(() => {
          if (tokens.current.get(selected.id) !== token) return;
          setStates((current) => ({
            ...current,
            [selected.id]: {
              status: "error",
              progress: 0,
              error: "Não foi possível ler este TXT.",
            },
          }));
        });
    }
  }, []);
  const [{ files, isDragging, errors }, actions] = useFileUpload({
    accept: "text/plain,.txt",
    maxFiles: 5,
    maxSize: MAX_SIZE,
    multiple: true,
    onFilesAdded: handleFilesAdded,
  });
  const isReading = files.some(
    (file) => !states[file.id] || states[file.id].status === "reading",
  );
  const hasError = files.some((file) => states[file.id]?.status === "error");
  const clearSelection = () => {
    tokens.current.clear();
    setStates({});
    actions.clearFiles();
  };
  const mutation = useMutation({
    mutationFn: async ({
      files: selected,
      texts,
    }: {
      files: File[];
      texts: string[];
    }) =>
      selected.length === 1
        ? uploadTxt(orgSlug, botSlug, selected[0], texts[0])
        : uploadTxts(orgSlug, botSlug, selected, texts),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
      toast.add({ title: "TXTs enviados com sucesso.", type: "success" });
      setOpen(false);
      clearSelection();
    },
  });
  const submit = () => {
    if (!files.length || mutation.isPending || isReading || hasError) return;
    const selected: File[] = [];
    const texts: string[] = [];
    for (const item of files) {
      if (!(item.file instanceof File)) return;
      const state = states[item.id];
      if (!state || state.status !== "ready") return;
      selected.push(item.file);
      texts.push(state.text);
    }
    mutation.mutate({ files: selected, texts });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && (mutation.isPending || isReading)) return;
        setOpen(next);
        if (!next) clearSelection();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UploadIcon className="size-4 opacity-60" />
          Uploads TXT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uploads TXT</DialogTitle>
          <DialogDescription>
            Selecione até 5 arquivos TXT para usar como dados do bot.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 hover:bg-accent/50"
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
                aria-label="Uploads TXT"
                className="sr-only"
                disabled={mutation.isPending}
              />
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex size-11 items-center justify-center rounded-full border bg-background">
                  <FileUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">Upload de TXT</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Arraste ou clique para selecionar
                </p>
                <div className="flex gap-1 text-xs text-muted-foreground/70">
                  <span>Apenas TXT</span>
                  <span>•</span>
                  <span>Até {formatBytes(MAX_SIZE)}</span>
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
            {files.map((item) => {
              const state = states[item.id];
              return (
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
                      {state?.status === "error" ? (
                        <p className="text-xs text-destructive" role="alert">
                          {state.error}
                        </p>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Progress
                            className="flex-1"
                            value={state?.progress ?? 0}
                          />
                          <span className="w-9 text-right text-xs text-muted-foreground">
                            {state?.progress ?? 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    aria-label={`Remover ${item.file.name}`}
                    className="-me-2 size-8"
                    disabled={mutation.isPending}
                    onClick={() => {
                      tokens.current.delete(item.id);
                      setStates((current) => {
                        const next = { ...current };
                        delete next[item.id];
                        return next;
                      });
                      actions.removeFile(item.id);
                    }}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={
              !files.length || mutation.isPending || isReading || hasError
            }
            onClick={submit}
            type="button"
          >
            {isReading
              ? "Lendo TXTs..."
              : mutation.isPending
                ? "Enviando..."
                : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
