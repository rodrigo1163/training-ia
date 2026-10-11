import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import {
  botsQueryKey,
  deleteBot,
  fetchBots,
  type Bot,
} from "@/components/bots/bots";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Frame } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function BotRow({
  bot,
  organizationSlug,
  isDeleting,
  onDelete,
}: {
  bot: Bot;
  organizationSlug: string;
  isDeleting: boolean;
  onDelete: (bot: Bot) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const cannotDelete = bot.documentCount > 0;

  const openBot = () =>
    navigate({
      params: { botSlug: bot.slug, orgSlug: organizationSlug },
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
        <TableCell className="font-medium">{bot.name}</TableCell>
        <TableCell>{bot.slug}</TableCell>
        <TableCell>{bot.documentCount}</TableCell>
        <TableCell>{dateFormatter.format(new Date(bot.createdAt))}</TableCell>
        <TableCell
          className="w-12 text-right"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Ações para ${bot.name}`}
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
                disabled={cannotDelete}
                onSelect={() => setConfirmOpen(true)}
                title={
                  cannotDelete
                    ? "Remova os PDFs antes de excluir o bot."
                    : undefined
                }
                variant="destructive"
              >
                <Trash2Icon aria-hidden="true" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

export function BotsTable({ organizationSlug }: { organizationSlug: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: botsQueryKey(organizationSlug),
    queryFn: () => fetchBots(organizationSlug),
  });
  const deleteMutation = useMutation({
    mutationFn: (bot: Bot) => deleteBot(organizationSlug, bot.slug),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: botsQueryKey(organizationSlug),
      });
      toast.add({ title: "Bot excluído com sucesso.", type: "success" });
    },
  });

  return (
    <Frame>
      <Table variant="card">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
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
            Array.from({ length: 3 }, (_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 5 }, (__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))
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
          ) : query.data.length === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={5}
              >
                Nenhum bot criado.
              </TableCell>
            </TableRow>
          ) : (
            query.data.map((bot) => (
              <BotRow
                bot={bot}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables?.id === bot.id
                }
                key={bot.id}
                onDelete={deleteMutation.mutate}
                organizationSlug={organizationSlug}
              />
            ))
          )}
        </TableBody>
      </Table>
    </Frame>
  );
}
