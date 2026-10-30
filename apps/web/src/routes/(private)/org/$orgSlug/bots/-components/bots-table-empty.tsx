import {
  TableCell,
  TableRow,
} from "@training-ia/ui/components/ui/table";

type BotsTableEmptyMode = "search" | "collection";

type BotsTableEmptyProps = {
  mode: BotsTableEmptyMode;
  layout: "table" | "cards";
};

const messages: Record<BotsTableEmptyMode, string> = {
  search: "No bots found.",
  collection: "No bots created yet.",
};

export function BotsTableEmpty({
  layout,
  mode,
}: BotsTableEmptyProps) {
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
