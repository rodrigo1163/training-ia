import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  createFetchDataEventSource,
  parseDocumentStatusUpdatedEvent,
} from "@/api/bots/fetch-data-events";
import type { FetchDataDetails } from "@/api/bots/types";

import {
  fetchDataDetailsQueryKey,
  fetchDataQueryKey,
} from "./use-fetch-data";

export function useFetchDataEvents({
  orgSlug,
  botSlug,
  selectedDocumentId,
}: {
  orgSlug: string;
  botSlug: string;
  selectedDocumentId: string | null;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = createFetchDataEventSource(orgSlug, botSlug);
    const refreshDocuments = () => {
      void queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
    };
    const refreshOpenDocument = (event: MessageEvent<string>) => {
      const payload = parseDocumentStatusUpdatedEvent(event.data);
      if (!payload || payload.documentId !== selectedDocumentId) return;

      const detailsQueryKey = fetchDataDetailsQueryKey(
        orgSlug,
        botSlug,
        selectedDocumentId,
      );

      queryClient.setQueryData<FetchDataDetails>(
        detailsQueryKey,
        (currentDetails) =>
          currentDetails
            ? {
                ...currentDetails,
                lastUpdatedAt: payload.updatedAt,
                status: payload.status,
              }
            : currentDetails,
      );
      void queryClient.invalidateQueries({ queryKey: detailsQueryKey });
    };

    eventSource.addEventListener("connected", refreshDocuments);
    eventSource.addEventListener("document.status.updated", refreshDocuments);
    eventSource.addEventListener(
      "document.status.updated",
      refreshOpenDocument,
    );

    return () => eventSource.close();
  }, [botSlug, orgSlug, queryClient, selectedDocumentId]);
}
