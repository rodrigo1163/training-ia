import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
import { Button } from "@training-ia/ui/components/ui/button";

const detailLabels = ["ID:", "Title:", "Url:", "Status:"];

export function DocumentDetailsSkeleton() {
  return (
    <div aria-label="Loading source details" className="mt-4 space-y-3">
      <div className="border-y">
        {["w-3/4", "w-2/3", "w-full", "w-20"].map((width, index) => (
          <div
            className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b px-1 py-2 last:border-b-0"
            key={index}
          >
            <span className="text-sm font-medium text-muted-foreground">
              {detailLabels[index]}
            </span>
            <Skeleton className={`h-4 ${width}`} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button disabled size="sm" type="button" variant="outline">
            Preview
          </Button>
          <Button disabled size="sm" type="button" variant="outline">
            Edit Markdown
          </Button>
        </div>
        <Button disabled size="sm" type="button" variant="destructive">
          Delete
        </Button>
      </div>
      <div className="mt-3 h-[min(65vh,calc(100dvh-22rem))] space-y-3 rounded-lg border bg-muted/20 p-4 sm:h-[min(65vh,calc(100dvh-26rem))]">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
