import { env } from "@/env";

import type { DocumentStatusUpdatedEvent } from "./types";

export function createFetchDataEventSource(
  orgSlug: string,
  botSlug: string,
): EventSource {
  return new EventSource(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/events`,
    { withCredentials: true },
  );
}

export function parseDocumentStatusUpdatedEvent(
  data: string,
): DocumentStatusUpdatedEvent | null {
  let value: unknown;

  try {
    value = JSON.parse(data) as unknown;
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;

  const event = value as Record<string, unknown>;
  if (
    typeof event.documentId !== "string" ||
    (event.status !== "READY" && event.status !== "FAILED") ||
    typeof event.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    documentId: event.documentId,
    status: event.status,
    updatedAt: event.updatedAt,
  };
}
