import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import {
  fetchDataDetailsQueryKey,
  fetchDataPageQueryKey,
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
import { botsQueryKey } from "@/components/bots/bots";
import { DocumentDetailsDialog } from "@/components/bots/document-details-dialog";
import { DocumentStatusBadge } from "@/components/bots/document-status-badge";
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
import { Frame } from "@training-ia/ui/components/ui/frame";
import { Input } from "@training-ia/ui/components/ui/input";
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

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = -1;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function getPaginationPages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  return [...pages].sort((left, right) => left - right);
}

function isDocumentStatusUpdatedEvent(value: unknown): value is {
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
        <TableCell
          className="w-10"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label={`Select ${item.url}`}
            checked={isSelected}
            disabled={isDeleting}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
          />
        </TableCell>
        <TableCell className="min-w-64 max-w-[25rem]">
          <button
            className="flex w-full min-w-0 items-center gap-3 text-left"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item.id);
            }}
            type="button"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileTextIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate font-semibold text-foreground"
                title={item.url}
              >
                {item.url}
              </span>
              <span className="block text-sm text-muted-foreground">
                {item.type}
              </span>
            </span>
          </button>
        </TableCell>
        <TableCell className="font-semibold">
          {formatBytes(item.size)}
        </TableCell>
        <TableCell>
          <DocumentStatusBadge status={item.status} />
        </TableCell>
        <TableCell
          className="w-32 text-right"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            <Button
              aria-label={`Delete ${item.url}`}
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(true)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the file &quot;{item.url}&quot;
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete(item.id);
              }}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="w-10">
        <Skeleton className="size-4 rounded-sm" />
      </TableCell>
      <TableCell className="min-w-64 max-w-[25rem]">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20 rounded-md" />
      </TableCell>
      <TableCell className="w-32 text-right">
        <div className="flex justify-end">
          <Skeleton className="size-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function DocumentCard({
  item,
  isDeleting,
  isSelected,
  onDelete,
  onOpen,
  onSelectChange,
}: DataRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function openDocument() {
    onOpen(item.id);
  }

  return (
    <>
      <article
        aria-busy={isDeleting || undefined}
        className="min-w-0 overflow-hidden rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
        onClick={openDocument}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDocument();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="pt-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              aria-label={`Select ${item.url}`}
              checked={isSelected}
              disabled={isDeleting}
              onCheckedChange={(checked) => onSelectChange(checked === true)}
            />
          </div>

          <button
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={(event) => {
              event.stopPropagation();
              openDocument();
            }}
            type="button"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileTextIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">
                {item.url}
              </span>
              <span className="block text-sm text-muted-foreground">
                {item.type}
              </span>
            </span>
          </button>

          <Button
            aria-label={`Delete ${item.url}`}
            className="shrink-0"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">Tamanho</span>
            <span className="font-semibold">{formatBytes(item.size)}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">Status</span>
            <DocumentStatusBadge status={item.status} />
          </div>
        </div>
      </article>

      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the file &quot;{item.url}&quot;
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete(item.id);
              }}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LoadingCards() {
  return Array.from({ length: 5 }, (_, index) => (
    <div className="rounded-lg border bg-background p-4" key={index}>
      <div className="flex items-start gap-3">
        <Skeleton className="mt-1 size-4 rounded-sm" />
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 max-w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const queryParams = {
    page,
    pageSize,
    search: searchTerm,
  } as const;
  const query = useQuery({
    queryKey: fetchDataPageQueryKey(orgSlug, botSlug, queryParams),
    queryFn: () => fetchOrganizationData(orgSlug, botSlug, queryParams),
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

  const documents = query.data?.documents ?? [];
  const totalSize = query.data?.totalSize ?? 0;
  const totalItems = query.data?.pagination.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleDocuments = documents;
  const paginationPages = getPaginationPages(totalPages, currentPage);
  const firstVisibleRow =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, totalItems);

  useEffect(() => {
    if (query.data && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, query.data, totalPages]);

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const availableDocumentIds = new Set(
      query.data.documents.map((item) => item.id),
    );

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
    const eventSource = new EventSource(fetchDataEventsUrl(orgSlug, botSlug), {
      withCredentials: true,
    });

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
        title: "Document deleted successfully.",
        type: "success",
      });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      markdown,
    }: {
      documentId: string;
      markdown: string;
    }) => updateOrganizationDataContent(orgSlug, botSlug, documentId, markdown),
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
        title: "Document text updated successfully.",
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
        title: "Documents deleted successfully.",
        type: "success",
      });
    },
  });

  const selectedCount = selectedDocumentIds.size;
  const allDocumentsSelected =
    visibleDocuments.length > 0 &&
    visibleDocuments.every((item) => selectedDocumentIds.has(item.id));
  const someDocumentsSelected =
    visibleDocuments.some((item) => selectedDocumentIds.has(item.id)) &&
    !allDocumentsSelected;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  return (
    <>
      <div className="@container w-full min-w-0 max-w-full">
        <Frame className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border bg-card p-0">
          <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {tabs}
              <div className="relative w-full min-w-0 sm:flex-1 sm:max-w-xs">
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search documents"
                  className="h-9 pl-9"
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search documents"
                  value={searchTerm}
                />
              </div>
            </div>
            <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="documents-page-size">
                  Documents per page
                </label>
                <div className="relative">
                  <select
                    aria-label="Documents per page"
                    className="h-9 appearance-none rounded-md border border-input bg-transparent px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id="documents-page-size"
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    value={pageSize}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {uploadAction}
              </div>
              {selectedCount > 0 && (
                <Button
                  className="ml-auto min-w-0 flex-1 sm:flex-none"
                  disabled={isDeleting}
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete selected
                </Button>
              )}
            </div>
          </div>
          <div className="hidden min-w-0 @min-[60rem]:block">
            <Table className="w-full min-w-[58rem]" variant="default">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all documents"
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
                        visibleDocuments.length === 0 ||
                        isDeleting
                      }
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setSelectedDocumentIds(
                            (current) =>
                              new Set([
                                ...current,
                                ...visibleDocuments.map((item) => item.id),
                              ]),
                          );
                        } else {
                          setSelectedDocumentIds((current) => {
                            const next = new Set(current);

                            visibleDocuments.forEach((item) =>
                              next.delete(item.id),
                            );
                            return next;
                          });
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell className="h-24 text-center" colSpan={5}>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Unable to load the bot data.
                        </span>
                        <Button
                          onClick={() => query.refetch()}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Try again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      {searchTerm
                        ? "No documents found."
                        : "No documents added yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleDocuments.map((item) => (
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
          </div>

          <div className="grid gap-3 p-4 @min-[40rem]:grid-cols-2 @min-[60rem]:hidden">
            {query.isPending ? (
              <LoadingCards />
            ) : query.isError ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  Unable to load the bot data.
                </span>
                <Button
                  onClick={() => query.refetch()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Try again
                </Button>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? "No documents found."
                  : "No documents added yet."}
              </div>
            ) : (
              visibleDocuments.map((item) => (
                <DocumentCard
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
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            {query.isPending ? (
              <>
                <Skeleton className="h-4 w-40" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <span>
                  Showing {firstVisibleRow} to {lastVisibleRow} of {totalItems}{" "}
                  entries
                </span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <span>Total size: {formatBytes(totalSize)}</span>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      aria-label="Previous page"
                      className="gap-1 text-muted-foreground"
                      disabled={currentPage === 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ChevronLeftIcon aria-hidden="true" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    {paginationPages.map((paginationPage, index) => {
                      const previousPage = paginationPages[index - 1];
                      const shouldShowEllipsis =
                        index > 0 &&
                        typeof previousPage === "number" &&
                        paginationPage - previousPage > 1;

                      return (
                        <span className="flex items-center" key={paginationPage}>
                          {shouldShowEllipsis && (
                            <span className="px-1">...</span>
                          )}
                          <Button
                            aria-current={
                              paginationPage === currentPage ? "page" : undefined
                            }
                            aria-label={`Page ${paginationPage}`}
                            className={
                              paginationPage === currentPage
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "text-muted-foreground"
                            }
                            onClick={() => setPage(paginationPage)}
                            size="sm"
                            type="button"
                            variant={
                              paginationPage === currentPage
                                ? "secondary"
                                : "ghost"
                            }
                          >
                            {paginationPage}
                          </Button>
                        </span>
                      );
                    })}
                    <Button
                      aria-label="Next page"
                      className="gap-1 text-muted-foreground"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage((value) => Math.min(totalPages, value + 1))
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRightIcon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Frame>
      </div>
      <AlertDialog
        onOpenChange={setIsBulkDeleteDialogOpen}
        open={isBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected documents?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedCount}{" "}
              {selectedCount === 1
                ? "Document selected"
                : "Documents selected"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                setIsBulkDeleteDialogOpen(false);
                bulkDeleteMutation.mutate([...selectedDocumentIds]);
              }}
              variant="destructive"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
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
        onUpdate={(markdown) => {
          if (selectedDocumentId) {
            updateMutation.mutate({
              documentId: selectedDocumentId,
              markdown,
            });
          }
        }}
        open={selectedDocumentId !== null}
      />
    </>
  );
}
