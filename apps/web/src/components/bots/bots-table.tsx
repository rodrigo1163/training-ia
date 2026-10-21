import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BotIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import {
  botsQueryKey,
  deleteBot,
  fetchBots,
  type Bot,
} from "@/components/bots/bots";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";
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
import { Frame } from "@training-ia/ui/components/ui/frame";
import { Input } from "@training-ia/ui/components/ui/input";
import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@training-ia/ui/components/ui/table";
import { toast } from "@training-ia/ui/components/ui/toast";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function getPaginationPages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  return [...pages].sort((left, right) => left - right);
}

function BotRow({
  bot,
  orgSlug,
  isDeleting,
  onDelete,
}: {
  bot: Bot;
  orgSlug: string;
  isDeleting: boolean;
  onDelete: (bot: Bot) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const cannotDelete = bot.documentCount > 0;

  const openBot = () =>
    navigate({
      params: { botSlug: bot.slug, orgSlug },
      to: "/org/$orgSlug/bots/$botSlug",
    });

  return (
    <>
      <TableRow
        aria-busy={isDeleting || undefined}
        aria-label={`Abrir ${bot.name}`}
        className="cursor-pointer"
        onClick={openBot}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBot();
          }
        }}
        role="link"
        tabIndex={0}
      >
        <TableCell className="min-w-56">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BotIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">
                {bot.name}
              </span>
              <span className="block text-sm text-muted-foreground">
                {bot.personality}
              </span>
            </span>
          </div>
        </TableCell>
        <TableCell>{bot.slug}</TableCell>
        <TableCell>{bot.documentCount}</TableCell>
        <TableCell>{dateFormatter.format(new Date(bot.createdAt))}</TableCell>
        <TableCell
          className="w-32 text-right"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            <Button
              aria-label={`Ações para ${bot.name}`}
              disabled={isDeleting || cannotDelete}
              onClick={() => setConfirmOpen(true)}
              size="icon-sm"
              title={
                cannotDelete
                  ? "Remova os PDFs antes de excluir o bot."
                  : undefined
              }
              type="button"
              variant="ghost"
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bot?</AlertDialogTitle>
            <AlertDialogDescription>
              O bot &quot;{bot.name}&quot; será excluído permanentemente.
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
                setConfirmOpen(false);
                onDelete(bot);
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
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="min-w-56">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell className="w-32 text-right">
        <div className="flex justify-end">
          <Skeleton className="size-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

export function BotsTable({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: botsQueryKey(orgSlug),
    queryFn: () => fetchBots(orgSlug),
  });
  const deleteMutation = useMutation({
    mutationFn: (bot: Bot) => deleteBot(orgSlug, bot.slug),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(orgSlug),
      });
      toast.add({ title: "Bot excluído com sucesso.", type: "success" });
    },
  });

  const bots = query.data ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  const filteredBots = bots.filter((bot) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return [bot.name, bot.slug].some((value) =>
      value.toLocaleLowerCase().includes(normalizedSearchTerm),
    );
  });
  const totalItems = filteredBots.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleBots = filteredBots.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const paginationPages = getPaginationPages(totalPages, currentPage);
  const firstVisibleRow =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, totalItems);

  useEffect(() => {
    if (query.data && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, query.data, totalPages]);

  return (
    <Frame className="overflow-hidden rounded-2xl border bg-card p-0 shadow-sm">
      <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Buscar bots"
            className="h-9 pl-9"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search bots"
            value={searchTerm}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <label className="sr-only" htmlFor="bots-page-size">
            Bots per page
          </label>
          <div className="relative">
            <select
              aria-label="Bots per page"
              className="h-9 appearance-none rounded-md border border-input bg-transparent px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="bots-page-size"
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
          <CreateBotDialog orgSlug={orgSlug} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[58rem]" variant="default">
        <TableHeader>
          <TableRow>
            <TableHead>Bot</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Created at</TableHead>
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
                    Não foi possível carregar os bots.
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
          ) : totalItems === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={5}
              >
                {searchTerm ? "Nenhum bot encontrado." : "Nenhum bot criado."}
              </TableCell>
            </TableRow>
          ) : (
            visibleBots.map((bot) => (
              <BotRow
                bot={bot}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables?.id === bot.id
                }
                key={bot.id}
                onDelete={deleteMutation.mutate}
                orgSlug={orgSlug}
              />
            ))
          )}
        </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        {query.isPending ? (
          <>
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center justify-end gap-1">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </>
        ) : (
          <>
            <span>
              Showing {firstVisibleRow} to {lastVisibleRow} of {totalItems} entries
            </span>
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
                    {shouldShowEllipsis && <span className="px-1">...</span>}
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
                        paginationPage === currentPage ? "secondary" : "ghost"
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
          </>
        )}
      </div>
    </Frame>
  );
}
