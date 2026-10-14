import { useEffect, useState, type ReactNode } from "react";
import {
  CircleCheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import type { FetchDataDetails } from "@/components/bots/fetch-data";
import { DocumentTextEditor } from "@/components/bots/document-text-editor";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function BarsRotateFadeSpinner() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 animate-[spin_1s_steps(12)_infinite] text-muted-foreground"
      viewBox="0 0 24 24"
    >
      <g fill="currentColor">
        {Array.from({ length: 12 }, (_, index) => (
          <rect
            height="5"
            key={index}
            opacity={Math.max(0.15, 1 - index * 0.075)}
            rx="1"
            transform={`rotate(${index * 30} 12 12)`}
            width="2"
            x="11"
            y="1.5"
          />
        ))}
      </g>
    </svg>
  );
}

type DocumentDetailsDialogProps = {
  data?: FetchDataDetails;
  error?: Error | null;
  isDeleting: boolean;
  isError: boolean;
  isPending: boolean;
  isUpdating: boolean;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onUpdate: (text: string) => void;
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
  isUpdating,
  onDelete,
  onOpenChange,
  onRetry,
  onUpdate,
  open,
}: DocumentDetailsDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [editedText, setEditedText] = useState("");
  const [hasEmptyTextError, setHasEmptyTextError] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab("preview");
    }
  }, [data?.id, open]);

  useEffect(() => {
    if (open && data) {
      setEditedText(data.text);
      setHasEmptyTextError(false);
    }
  }, [data?.id, data?.text, open]);

  function handleTextChange(value: string) {
    setEditedText(value);
    setHasEmptyTextError(false);
  }

  function handleSave() {
    if (editedText.trim().length === 0) {
      setHasEmptyTextError(true);
      return;
    }

    onUpdate(editedText);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-4xl gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)] sm:max-w-3xl">
        <div className="p-6 pb-6">
          <DialogHeader>
            <DialogTitle>Source</DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes e preview do PDF selecionado.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div
              aria-label="Carregando detalhes da fonte"
              className="mt-4 space-y-3"
            >
              <div className="border-y">
                <DetailRow label="ID:">
                  <Skeleton className="h-4 w-3/4" />
                </DetailRow>
                <DetailRow label="Title:">
                  <Skeleton className="h-4 w-2/3" />
                </DetailRow>
                <DetailRow label="Url:">
                  <Skeleton className="h-4 w-full" />
                </DetailRow>
                <DetailRow label="Status:">
                  <Skeleton className="h-4 w-20" />
                </DetailRow>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>

              <div className="mt-3 h-[min(65vh,calc(100dvh-22rem))] space-y-3 rounded-lg border bg-muted/20 p-4 sm:h-[min(65vh,calc(100dvh-26rem))]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[95%]" />
                <Skeleton className="h-4 w-[88%]" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-3/4" />
              </div>
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
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusClasses[data.status]}`}
                  >
                    {data.status === "PROCESSING" && <BarsRotateFadeSpinner />}
                    {data.status === "READY" && (
                      <CircleCheckIcon
                        aria-hidden="true"
                        className="size-4 text-green-500"
                      />
                    )}
                    {statusLabels[data.status]}
                  </span>
                </DetailRow>
              </div>

              <Tabs
                className="min-h-0"
                onValueChange={(value) =>
                  setActiveTab(value as "preview" | "edit")
                }
                value={activeTab}
              >
                <div className="mt-4 flex items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="preview">
                      <EyeIcon aria-hidden="true" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <PencilIcon aria-hidden="true" />
                      Edit
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    {activeTab === "edit" && (
                      <Button
                        disabled={
                          editedText === data.text || isDeleting || isUpdating
                        }
                        onClick={handleSave}
                        size="sm"
                        type="button"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                    )}
                    <Button
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting || isUpdating}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      size="sm"
                      type="button"
                    >
                      <Trash2Icon aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>

                <TabsContent className="mt-3 min-h-0" value="preview">
                  <ScrollArea className="mb-4 h-[min(65vh,calc(100dvh-22rem))] rounded-lg border bg-muted/20 p-4 sm:h-[min(65vh,calc(100dvh-26rem))]">
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
                </TabsContent>

                <TabsContent className="mt-3 min-h-0" value="edit">
                  <DocumentTextEditor
                    hasEmptyTextError={hasEmptyTextError}
                    isSaving={isUpdating}
                    onChange={handleTextChange}
                    text={editedText}
                  />
                </TabsContent>
              </Tabs>
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
            <AlertDialogCancel disabled={isDeleting || isUpdating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting || isUpdating}
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
