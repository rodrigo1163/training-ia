import { env } from "@/env";

import type {
  FetchDataItem,
  FetchDataPayload,
  FetchDataQueryParams,
  FetchDataResponse,
} from "./types";

function isFetchDataType(value: unknown): value is FetchDataItem["type"] {
  return (
    value === "PDF" ||
    value === "TXT" ||
    value === "DOC" ||
    value === "DOCX" ||
    value === "WEBSITE"
  );
}

export async function fetchData(
  orgSlug: string,
  botSlug: string,
  params: FetchDataQueryParams,
): Promise<FetchDataResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.search.trim()) searchParams.set("search", params.search.trim());

  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data?${searchParams.toString()}`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Unable to load the bot data.");

  const payload = (await response.json()) as FetchDataPayload;

  if (!Array.isArray(payload.documents)) {
    throw new Error("The backend returned an invalid data list.");
  }
  if (typeof payload.totalSize !== "number") {
    throw new Error("The backend returned an invalid total size.");
  }
  if (
    typeof payload.pagination?.page !== "number" ||
    typeof payload.pagination.pageSize !== "number" ||
    typeof payload.pagination.totalItems !== "number"
  ) {
    throw new Error("The backend returned invalid pagination.");
  }
  if (
    payload.documents.some(
      (document) =>
        typeof document.id !== "string" ||
        !isFetchDataType(document.type) ||
        typeof document.url !== "string" ||
        typeof document.status !== "string" ||
        typeof document.size !== "number" ||
        typeof document.lastUpdatedAt !== "string",
    )
  ) {
    throw new Error("The backend returned invalid document data.");
  }

  return {
    documents: payload.documents,
    totalSize: payload.totalSize,
    pagination: payload.pagination,
  };
}
