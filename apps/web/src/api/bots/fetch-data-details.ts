import { env } from "@/env";

import type { FetchDataDetails } from "./types";

function isFetchDataType(value: unknown): value is FetchDataDetails["type"] {
  return (
    value === "PDF" ||
    value === "TXT" ||
    value === "DOC" ||
    value === "DOCX" ||
    value === "WEBSITE"
  );
}

function isFetchDataStatus(
  value: unknown,
): value is FetchDataDetails["status"] {
  return (
    value === "PENDING" ||
    value === "PROCESSING" ||
    value === "READY" ||
    value === "FAILED"
  );
}

export async function fetchDataDetails(
  orgSlug: string,
  botSlug: string,
  documentId: string,
): Promise<FetchDataDetails> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/${encodeURIComponent(documentId)}`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Unable to load the document details.");

  const payload = (await response.json()) as Partial<FetchDataDetails>;
  if (
    typeof payload.id !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.markdown !== "string" ||
    typeof payload.url !== "string" ||
    !isFetchDataType(payload.type) ||
    !isFetchDataStatus(payload.status) ||
    typeof payload.lastUpdatedAt !== "string"
  ) {
    throw new Error("The backend returned invalid document details.");
  }

  return {
    ...payload,
    markdown: payload.markdown,
    url: payload.url.startsWith("http")
      ? payload.url
      : `${env.VITE_API_URL}${payload.url}`,
  } as FetchDataDetails;
}
