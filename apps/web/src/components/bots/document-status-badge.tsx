import { LoaderIcon } from "lucide-react";

import type { FetchDataItem } from "@/components/bots/fetch-data";

export const documentStatusConfig = {
  PENDING: {
    label: "Processing",
    showSpinner: true,
    className:
      "bg-orange-100 text-orange-600 dark:bg-amber-950/60 dark:text-amber-400",
  },
  PROCESSING: {
    label: "Processing",
    showSpinner: true,
    className:
      "bg-orange-100 text-orange-600 dark:bg-amber-950/60 dark:text-amber-400",
  },
  READY: {
    label: "Active",
    showSpinner: false,
    className:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  FAILED: {
    label: "Inactive",
    showSpinner: false,
    className: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
  },
} as const;

type DocumentStatusBadgeProps = {
  status: FetchDataItem["status"];
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = documentStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.showSpinner && (
        <LoaderIcon aria-hidden="true" className="size-3 animate-spin" />
      )}
      {config.label}
    </span>
  );
}
