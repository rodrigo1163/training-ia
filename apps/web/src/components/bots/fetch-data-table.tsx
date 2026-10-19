import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  CircleCheckIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";

import {
  fetchDataDetailsQueryKey,
  fetchDataQueryKey,
  fetchDataEventsUrl,
  deleteManyOrganizationData,
  deleteOrganizationData,
  fetchOrganizationDataDetails,
  fetchOrganizationData,
  updateOrganizationDataContent,
  type FetchDataDetails,
  type FetchDataItem,
} from "@/components/bots/fetch-data";
import type { TiptapDocument } from "@/lib/tiptap-content";
import { botsQueryKey } from "@/components/bots/bots";
import { DocumentDetailsDialog } from "@/components/bots/document-details-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@training-ia/ui/components/ui/alert-dialog";
import { Button } from "@training-ia/ui/components/ui/button";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@training-ia/ui/components/ui/dropdown-menu";
import { Frame } from "@training-ia/ui/components/ui/frame";
import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { toast } from "@training-ia/ui/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@training-ia/ui/components/ui/table";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const statusLabels = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
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

function isDocumentStatusUpdatedEvent(
  value: unknown,
): value is {
  documentId: string;
  status: "READY" | "FAILED";
  updatedAt: string;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;

  return (
    typeof event.documentId === "string" &&
    (event.status === "READY" || event.status === "FAILED") &&
    typeof event.updatedAt === "string"
  );
}

type FetchDataTableProps = {
  orgSlug: string;
  botSlug: string;
  tabs: ReactNode;
  uploadAction: ReactNode;
};

type DataRowProps = {
  item: FetchDataItem;
  isDeleting: boolean;
  isSelected: boolean;
  onDelete: (documentId: string) => void;
  onOpen: (documentId: string) => void;
  onSelectChange: (isSelected: boolean) => void;
};

function DataRow({
  item,
  isDeleting,
  isSelected,
  onDelete,
  onOpen,
  onSelectChange,
}: DataRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <TableRow
        aria-busy={isDeleting || undefined}
        className="cursor-pointer"
        onClick={() => onOpen(item.id)}
      >
        <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
          <Checkbox
            aria-label={`Selecionar ${item.url}`}
            checked={isSelected}
            disabled={isDeleting}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
          />
        </TableCell>
        <TableCell className="font-medium">{item.type}</TableCell>
        <TableCell className="max-w-80 truncate" title={item.url}>
          <button
            className="max-w-full truncate text-left font-medium text-primary underline-offset-2 hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item.id);
            }}
            type="button"
          >
            {item.url}
          </button>
        </TableCell>
        <TableCell className="min-w-32">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            {item.status === "PROCESSING" && (
              <BarsRotateFadeSpinner />
            )}
            {item.status === "READY" && (
              <CircleCheckIcon
                aria-hidden="true"
                className="size-4 text-green-500"
              />
            )}
            {statusLabels[item.status]}
          </span>
        </TableCell>
        <TableCell>
          {dateTimeFormatter.format(new Date(item.lastUpdatedAt))}
        </TableCell>
        <TableCell
          className="w-12 text-right"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Ações para ${item.url}`}
                disabled={isDeleting}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
              >
                <Trash2Icon aria-hidden="true" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDF?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o arquivo &quot;{item.url}&quot;
              permanentemente.
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
                onDelete(item.id);
              }}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LoadingRows() {
  return Array.from({ length: 3 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 6 }, (__, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function FetchDataTable({
  orgSlug,
  botSlug,
  tabs,
  uploadAction,
}: FetchDataTableProps) {
  const queryClient = useQueryClient();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const query = useQuery({
    queryKey: fetchDataQueryKey(orgSlug, botSlug),
    queryFn: () => fetchOrganizationData(orgSlug, botSlug),
  });
  const documentDetailsQuery = useQuery({
    enabled: selectedDocumentId !== null,
    queryKey: fetchDataDetailsQueryKey(
      orgSlug,
      botSlug,
      selectedDocumentId ?? "",
    ),
    queryFn: () =>
      fetchOrganizationDataDetails(
        orgSlug,
        botSlug,
        selectedDocumentId as string,
      ),
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const availableDocumentIds = new Set(query.data.map((item) => item.id));

    setSelectedDocumentIds((current) => {
      const next = new Set(
        [...current].filter((documentId) =>
          availableDocumentIds.has(documentId),
        ),
      );

      return next.size === current.size ? current : next;
    });
  }, [query.data]);

  useEffect(() => {
    const eventSource = new EventSource(
      fetchDataEventsUrl(orgSlug, botSlug),
      { withCredentials: true },
    );

    const refreshDocuments = () => {
      void queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
    };

    const refreshOpenDocument = (event: MessageEvent<string>) => {
      let payload: unknown;

      try {
        payload = JSON.parse(event.data) as unknown;
      } catch {
        return;
      }

      if (
        !isDocumentStatusUpdatedEvent(payload) ||
        payload.documentId !== selectedDocumentId
      ) {
        return;
      }

      const detailsQueryKey = fetchDataDetailsQueryKey(
        orgSlug,
        botSlug,
        selectedDocumentId,
      );

      queryClient.setQueryData<FetchDataDetails>(
        detailsQueryKey,
        (currentDetails) =>
          currentDetails
            ? {
                ...currentDetails,
                lastUpdatedAt: payload.updatedAt,
                status: payload.status,
              }
            : currentDetails,
      );
      void queryClient.invalidateQueries({ queryKey: detailsQueryKey });
    };

    eventSource.addEventListener("connected", refreshDocuments);
    eventSource.addEventListener("document.status.updated", refreshDocuments);
    eventSource.addEventListener(
      "document.status.updated",
      refreshOpenDocument,
    );

    return () => {
      eventSource.close();
    };
  }, [botSlug, orgSlug, queryClient, selectedDocumentId]);

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      deleteOrganizationData(orgSlug, botSlug, documentId),
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
    onSuccess: async () => {
      setSelectedDocumentId(null);
      setSelectedDocumentIds(new Set());
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(orgSlug),
      });
      toast.add({
        title: "PDF excluído com sucesso.",
        type: "success",
      });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ documentId, content, text }: { documentId: string; content: TiptapDocument; text: string }) =>
      updateOrganizationDataContent(orgSlug, botSlug, documentId, content, text),
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: fetchDataQueryKey(orgSlug, botSlug),
        }),
        documentDetailsQuery.refetch(),
      ]);
      toast.add({
        title: "PDF text updated successfully.",
        type: "success",
      });
    },
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: (documentIds: string[]) =>
      deleteManyOrganizationData(orgSlug, botSlug, documentIds),
    onError: (error) => {
      toast.add({
        title: error.message,
        type: "error",
      });
    },
    onSuccess: async () => {
      setSelectedDocumentIds(new Set());
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(orgSlug),
      });
      toast.add({
        title: "PDFs excluídos com sucesso.",
        type: "success",
      });
    },
  });

  const selectedCount = selectedDocumentIds.size;
  const totalRows = query.data?.length ?? 0;
  const completedRows =
    query.data?.filter((item) => item.status === "READY").length ?? 0;
  const allDocumentsSelected =
    query.data !== undefined &&
    query.data.length > 0 &&
    selectedCount === query.data.length;
  const someDocumentsSelected = selectedCount > 0 && !allDocumentsSelected;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-3 py-3">
        {tabs}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              disabled={isDeleting}
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              size="sm"
              type="button"
              variant="destructive"
            >
              <Trash2Icon aria-hidden="true" />
              Delete Selected
            </Button>
          )}
          {uploadAction}
        </div>
      </div>
      <div className="px-3 pb-2 text-sm text-muted-foreground">
        {completedRows}/{totalRows} rows completed
      </div>
      <Frame>
        <Table variant="card">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="Selecionar todos os documentos"
                checked={
                  allDocumentsSelected
                    ? true
                    : someDocumentsSelected
                      ? "indeterminate"
                      : false
                }
                disabled={
                  query.isPending ||
                  query.isError ||
                  query.data?.length === 0 ||
                  isDeleting
                }
                onCheckedChange={(checked) => {
                  if (checked === true && query.data) {
                    setSelectedDocumentIds(
                      new Set(query.data.map((item) => item.id)),
                    );
                  } else {
                    setSelectedDocumentIds(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="min-w-32">Status</TableHead>
            <TableHead>Last updated at</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={6}>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Não foi possível carregar os dados do bot.
                  </span>
                  <Button
                    onClick={() => query.refetch()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : query.data.length === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={6}
              >
                Nenhum PDF adicionado.
              </TableCell>
            </TableRow>
          ) : (
            query.data.map((item) => (
              <DataRow
                isDeleting={
                  (deleteMutation.isPending &&
                    deleteMutation.variables === item.id) ||
                  bulkDeleteMutation.isPending
                }
                isSelected={selectedDocumentIds.has(item.id)}
                item={item}
                key={item.id}
                onDelete={deleteMutation.mutate}
                onOpen={setSelectedDocumentId}
                onSelectChange={(isSelected) => {
                  setSelectedDocumentIds((current) => {
                    const next = new Set(current);

                    if (isSelected) {
                      next.add(item.id);
                    } else {
                      next.delete(item.id);
                    }

                    return next;
                  });
                }}
              />
            ))
          )}
        </TableBody>
        </Table>
      </Frame>
      <AlertDialog
        onOpenChange={setIsBulkDeleteDialogOpen}
        open={isBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDFs selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente {selectedCount}{" "}
              {selectedCount === 1 ? "PDF selecionado" : "PDFs selecionados"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                setIsBulkDeleteDialogOpen(false);
                bulkDeleteMutation.mutate([...selectedDocumentIds]);
              }}
            >
              {bulkDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DocumentDetailsDialog
        data={documentDetailsQuery.data}
        error={documentDetailsQuery.error}
        isDeleting={isDeleting}
        isError={documentDetailsQuery.isError}
        isPending={documentDetailsQuery.isPending}
        isUpdating={updateMutation.isPending}
        onDelete={() => {
          if (selectedDocumentId) {
            deleteMutation.mutate(selectedDocumentId);
          }
        }}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedDocumentId(null);
          }
        }}
        onRetry={() => void documentDetailsQuery.refetch()}
        onUpdate={(content, text) => {
          if (selectedDocumentId) {
            updateMutation.mutate({
              documentId: selectedDocumentId,
              content,
              text,
            });
          }
        }}
        open={selectedDocumentId !== null}
      />
    </>
  );
}
