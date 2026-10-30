import {
  TableCell,
  TableRow,
} from "@training-ia/ui/components/ui/table";

type FetchDataEmptyMode = "search" | "collection" | "page";

type FetchDataEmptyProps = {
  mode: FetchDataEmptyMode;
  layout: "table" | "cards";
};

const messages: Record<FetchDataEmptyMode, string> = {
  search: "No documents found.",
  collection: "No documents added yet.",
  page: "No documents on this page.",
};

export function FetchDataEmpty({
  layout,
  mode,
}: FetchDataEmptyProps) {
  const message = messages[mode];

  if (layout === "table") {
    return (
      <TableRow>
        <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
          {message}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
