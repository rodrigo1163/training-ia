import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react'

import {
  fetchDataQueryKey,
  deleteOrganizationData,
  fetchOrganizationData,
  type FetchDataItem,
} from '@/components/bots/fetch-data'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Frame } from '@/components/ui/frame'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

type FetchDataTableProps = {
  organizationSlug: string
}

type DataRowProps = {
  item: FetchDataItem
  isDeleting: boolean
  onDelete: (documentId: string) => void
}

function DataRow({ item, isDeleting, onDelete }: DataRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <TableRow aria-busy={isDeleting || undefined}>
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
            Pending
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
              Esta ação excluirá o arquivo &quot;{item.url}&quot; permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteDialogOpen(false)
                onDelete(item.id)
              }}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function LoadingRows() {
  return Array.from({ length: 3 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 5 }, (__, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function FetchDataTable({ organizationSlug }: FetchDataTableProps) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: fetchDataQueryKey(organizationSlug),
    queryFn: () => fetchOrganizationData(organizationSlug),
  })
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      deleteOrganizationData(organizationSlug, documentId),
    onError: (error) => {
      toast.add({
        title: error.message,
        type: 'error',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(organizationSlug),
      })
      toast.add({
        title: 'PDF excluído com sucesso.',
        type: 'success',
      })
    },
  })

  return (
    <Frame>
      <Table variant="card">
        <TableHeader>
          <TableRow>
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
              <TableCell className="h-24 text-center" colSpan={5}>
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
                colSpan={5}
              >
                Nenhum PDF adicionado.
              </TableCell>
            </TableRow>
          ) : (
            query.data.map((item) => (
              <DataRow
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === item.id
                }
                item={item}
                key={item.id}
                onDelete={deleteMutation.mutate}
              />
            ))
          )}
        </TableBody>
      </Table>
    </Frame>
  )
}
