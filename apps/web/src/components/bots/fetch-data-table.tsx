import { useQuery } from '@tanstack/react-query'

import {
  fetchDataQueryKey,
  fetchOrganizationData,
  type FetchDataItem,
} from '@/components/bots/fetch-data'
import { Button } from '@/components/ui/button'
import { Frame } from '@/components/ui/frame'
import { Skeleton } from '@/components/ui/skeleton'
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

function DataRow({ item }: { item: FetchDataItem }) {
  return (
    <TableRow>
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
    </TableRow>
  )
}

function LoadingRows() {
  return Array.from({ length: 3 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 4 }, (__, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function FetchDataTable({ organizationSlug }: FetchDataTableProps) {
  const query = useQuery({
    queryKey: fetchDataQueryKey(organizationSlug),
    queryFn: () => fetchOrganizationData(organizationSlug),
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={4}>
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
                colSpan={4}
              >
                Nenhum PDF adicionado.
              </TableCell>
            </TableRow>
          ) : (
            query.data.map((item) => <DataRow item={item} key={item.id} />)
          )}
        </TableBody>
      </Table>
    </Frame>
  )
}
