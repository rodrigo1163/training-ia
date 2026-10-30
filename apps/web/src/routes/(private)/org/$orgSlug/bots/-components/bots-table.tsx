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

import { ButtonSpinner } from "@/components/button-spinner";
import { useBotsQuery, useDeleteBotMutation } from "@/hooks/use-bots";
import type { Bot } from "@/api/bots/types";
import { CreateBotDialog } from "./create-bot-dialog";
import { BotsTableError } from "./bots-table-error";
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
        aria-label={`Open ${bot.name}`}
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
        <TableCell className="min-w-56 max-w-[22rem]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BotIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-foreground">
                {bot.name}
              </span>
              <span className="block truncate text-sm text-muted-foreground">
                {bot.personality}
              </span>
            </span>
          </div>
        </TableCell>
        <TableCell className="max-w-[18rem]">
          <span className="block truncate" title={bot.slug}>
            {bot.slug}
          </span>
        </TableCell>
        <TableCell>{bot.documentCount}</TableCell>
        <TableCell>{dateFormatter.format(new Date(bot.createdAt))}</TableCell>
        <TableCell
          className="w-32 text-right"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            <Button
              aria-label={`Actions for ${bot.name}`}
              disabled={isDeleting || cannotDelete}
              onClick={() => setConfirmOpen(true)}
              size="icon-sm"
              title={
                cannotDelete
                  ? "Remove the PDFs before deleting the bot."
                  : undefined
              }
              type="button"
              variant="ghost"
            >
              {isDeleting ? <ButtonSpinner /> : <Trash2Icon aria-hidden="true" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bot?</AlertDialogTitle>
            <AlertDialogDescription>
              The bot &quot;{bot.name}&quot; will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                setConfirmOpen(false);
                onDelete(bot);
              }}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
              {isDeleting && <ButtonSpinner />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BotCard({
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
      <article
        aria-busy={isDeleting || undefined}
        aria-label={`Open ${bot.name}`}
        className="min-w-0 overflow-hidden rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
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
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BotIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">
                {bot.name}
              </span>
              <span className="block truncate text-sm text-muted-foreground">
                {bot.personality}
              </span>
            </span>
          </div>
          <Button
            aria-label={`Actions for ${bot.name}`}
            className="shrink-0"
            disabled={isDeleting || cannotDelete}
            onClick={(event) => {
              event.stopPropagation();
              setConfirmOpen(true);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            size="icon-sm"
            title={
              cannotDelete
                ? "Remove the PDFs before deleting the bot."
                : undefined
            }
            type="button"
            variant="ghost"
          >
            {isDeleting ? <ButtonSpinner /> : <Trash2Icon aria-hidden="true" />}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">Slug</span>
            <span className="block truncate font-semibold">{bot.slug}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              Documents
            </span>
            <span className="font-semibold">{bot.documentCount}</span>
          </div>
          <div className="col-span-2 min-w-0">
            <span className="block text-xs text-muted-foreground">
              Created at
            </span>
            <span className="font-semibold">
              {dateFormatter.format(new Date(bot.createdAt))}
            </span>
          </div>
        </div>
      </article>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bot?</AlertDialogTitle>
            <AlertDialogDescription>
              The bot &quot;{bot.name}&quot; will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                setConfirmOpen(false);
                onDelete(bot);
              }}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
              {isDeleting && <ButtonSpinner />}
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
      <TableCell className="min-w-56 max-w-[22rem]">
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

function LoadingCards() {
  return Array.from({ length: 5 }, (_, index) => (
    <div className="rounded-lg border bg-background p-4" key={index}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  ));
}

export function BotsTable({ orgSlug }: { orgSlug: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const query = useBotsQuery(orgSlug);
  const deleteMutation = useDeleteBotMutation(orgSlug);

  function handleDelete(bot: Bot) {
    deleteMutation.mutate(bot.slug, {
      onError: (error) => toast.add({ title: error.message, type: "error" }),
      onSuccess: () =>
        toast.add({ title: "Bot deleted successfully.", type: "success" }),
    });
  }

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
    <div className="@container w-full min-w-0 max-w-full">
      <Frame className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border bg-card p-0">
        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full min-w-0 sm:flex-1 sm:max-w-xs">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search bots"
              className="h-9 pl-9"
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search bots"
              value={searchTerm}
            />
          </div>
          <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <div className="flex items-center gap-2">
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
        </div>
        <div className="hidden min-w-0 @min-[60rem]:block">
          <Table className="w-full min-w-[58rem]" variant="default">
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
                    <BotsTableError onRetry={() => void query.refetch()} />
                  </TableCell>
                </TableRow>
              ) : totalItems === 0 ? (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    {searchTerm ? "No bots found." : "No bots created yet."}
                  </TableCell>
                </TableRow>
              ) : (
                visibleBots.map((bot) => (
                  <BotRow
                    bot={bot}
                    isDeleting={
                      deleteMutation.isPending &&
                      deleteMutation.variables === bot.slug
                    }
                    key={bot.id}
                    onDelete={handleDelete}
                    orgSlug={orgSlug}
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
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4">
              <BotsTableError onRetry={() => void query.refetch()} />
            </div>
          ) : totalItems === 0 ? (
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              {searchTerm ? "No bots found." : "No bots created yet."}
            </div>
          ) : (
            visibleBots.map((bot) => (
              <BotCard
                bot={bot}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === bot.slug
                }
                key={bot.id}
                onDelete={handleDelete}
                orgSlug={orgSlug}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {query.isPending ? (
            <>
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center justify-end gap-1">
                <Button disabled size="sm" type="button" variant="ghost">
                  Previous
                </Button>
                <Button disabled size="sm" type="button" variant="ghost">
                  1
                </Button>
                <Button disabled size="sm" type="button" variant="ghost">
                  2
                </Button>
                <Button disabled size="sm" type="button" variant="ghost">
                  3
                </Button>
                <Button disabled size="sm" type="button" variant="ghost">
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <span>
                Showing {firstVisibleRow} to {lastVisibleRow} of {totalItems}{" "}
                entries
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
    </div>
  );
}
