import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import {
  fetchDataQueryKey,
  fetchDataEventsUrl,
  deleteManyOrganizationData,
  deleteOrganizationData,
  fetchOrganizationData,
  type FetchDataItem,
} from "@/components/bots/fetch-data";
import { botsQueryKey } from "@/components/bots/bots";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Frame } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type FetchDataTableProps = {
  orgSlug: string;
  botSlug: string;
};

type DataRowProps = {
  item: FetchDataItem;
  isDeleting: boolean;
  isSelected: boolean;
  onDelete: (documentId: string) => void;
  onSelectChange: (isSelected: boolean) => void;
};

function DataRow({
  item,
  isDeleting,
  isSelected,
  onDelete,
  onSelectChange,
}: DataRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <TableRow aria-busy={isDeleting || undefined}>
        <TableCell className="w-10">
          <Checkbox
            aria-label={`Selecionar ${item.url}`}
            checked={isSelected}
            disabled={isDeleting}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
          />
        </TableCell>
        <TableCell className="font-medium">{item.type}</TableCell>
        <TableCell className="max-w-80 truncate" title={item.url}>
          {item.url}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-amber-500"
            />
            {statusLabels[item.status]}
          </span>
        </TableCell>
        <TableCell>
          {dateTimeFormatter.format(new Date(item.lastUpdatedAt))}
        </TableCell>
        <TableCell className="w-12 text-right">
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
}: FetchDataTableProps) {
  const queryClient = useQueryClient();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const query = useQuery({
    queryKey: fetchDataQueryKey(orgSlug, botSlug),
    queryFn: () => fetchOrganizationData(orgSlug, botSlug),
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

    eventSource.addEventListener("connected", refreshDocuments);
    eventSource.addEventListener("document.status.updated", refreshDocuments);

    return () => {
      eventSource.close();
    };
  }, [botSlug, orgSlug, queryClient]);

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
  const allDocumentsSelected =
    query.data !== undefined &&
    query.data.length > 0 &&
    selectedCount === query.data.length;
  const someDocumentsSelected = selectedCount > 0 && !allDocumentsSelected;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  return (
    <Frame>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="text-sm text-muted-foreground">
            {selectedCount}{" "}
            {selectedCount === 1 ? "PDF selecionado" : "PDFs selecionados"}
          </span>
          <Button
            disabled={isDeleting}
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2Icon aria-hidden="true" />
            Excluir selecionados
          </Button>
        </div>
      )}
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
            <TableHead>Status</TableHead>
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
    </Frame>
  );
}
