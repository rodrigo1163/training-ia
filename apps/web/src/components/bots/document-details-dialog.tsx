import { useState, type ReactNode } from "react";
import { ExternalLinkIcon, EyeIcon, Trash2Icon } from "lucide-react";

import type { FetchDataDetails } from "@/components/bots/fetch-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
} as const;

const statusClasses = {
  PENDING: "text-muted-foreground",
  PROCESSING: "text-amber-600 dark:text-amber-400",
  READY: "text-green-600 dark:text-green-400",
  FAILED: "text-destructive",
} as const;

type DocumentDetailsDialogProps = {
  data?: FetchDataDetails;
  error?: Error | null;
  isDeleting: boolean;
  isError: boolean;
  isPending: boolean;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  open: boolean;
};

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b px-1 py-2 text-sm last:border-b-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function DocumentDetailsDialog({
  data,
  error,
  isDeleting,
  isError,
  isPending,
  onDelete,
  onOpenChange,
  onRetry,
  open,
}: DocumentDetailsDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Source</DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes e preview do PDF selecionado.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : isError || !data ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
              <p className="text-sm text-destructive">
                {error?.message ?? "Não foi possível carregar o PDF."}
              </p>
              <Button onClick={onRetry} size="sm" type="button" variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-4 border-y">
                <DetailRow label="ID:">
                  <span className="break-all">{data.id}</span>
                </DetailRow>
                <DetailRow label="Title:">
                  <span className="break-words">{data.title}</span>
                </DetailRow>
                <DetailRow label="Url:">
                  <a
                    className="inline-flex max-w-full items-center gap-1 break-all text-primary underline-offset-2 hover:underline"
                    href={data.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>{data.url}</span>
                    <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  </a>
                </DetailRow>
                <DetailRow label="Status:">
                  <span className={`font-medium ${statusClasses[data.status]}`}>
                    {statusLabels[data.status]}
                  </span>
                </DetailRow>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  aria-current="page"
                  aria-pressed="true"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <EyeIcon aria-hidden="true" />
                  Preview
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  size="sm"
                  type="button"
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </Button>
              </div>

              <ScrollArea className="mt-3 h-[min(65vh,40rem)] rounded-lg border bg-muted/20 p-4">
                {data.text.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {data.text}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum texto extraído para este PDF.
                  </p>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>

      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDF?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente o arquivo &quot;{data?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete();
              }}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
