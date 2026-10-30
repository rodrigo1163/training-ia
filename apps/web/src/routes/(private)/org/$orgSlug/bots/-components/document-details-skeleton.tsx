import { Skeleton } from "@training-ia/ui/components/ui/skeleton";

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
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
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
