import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteData } from "@/api/bots/delete-data";
import { deleteManyData } from "@/api/bots/delete-many-data";
import { fetchData } from "@/api/bots/fetch-data";
import { fetchDataDetails } from "@/api/bots/fetch-data-details";
import { updateDataContent } from "@/api/bots/update-data-content";
import type { FetchDataQueryParams } from "@/api/bots/types";

import { botsQueryKey } from "./use-bots";

export const fetchDataQueryKey = (orgSlug: string, botSlug: string) =>
  ["fetch-data", orgSlug, botSlug] as const;

export const fetchDataPageQueryKey = (
  orgSlug: string,
  botSlug: string,
  params: FetchDataQueryParams,
) => [...fetchDataQueryKey(orgSlug, botSlug), params] as const;

export const fetchDataDetailsQueryKey = (
  orgSlug: string,
  botSlug: string,
  documentId: string,
) => ["fetch-data-details", orgSlug, botSlug, documentId] as const;

export function fetchDataQueryOptions(
  orgSlug: string,
  botSlug: string,
  params: FetchDataQueryParams,
) {
  return queryOptions({
    queryKey: fetchDataPageQueryKey(orgSlug, botSlug, params),
    queryFn: () => fetchData(orgSlug, botSlug, params),
  });
}

export function fetchDataDetailsQueryOptions(
  orgSlug: string,
  botSlug: string,
  documentId: string,
) {
  return queryOptions({
    queryKey: fetchDataDetailsQueryKey(orgSlug, botSlug, documentId),
    queryFn: () => fetchDataDetails(orgSlug, botSlug, documentId),
  });
}

export function useFetchDataQuery(
  orgSlug: string,
  botSlug: string,
  params: FetchDataQueryParams,
) {
  return useQuery(fetchDataQueryOptions(orgSlug, botSlug, params));
}

export function useFetchDataDetailsQuery(
  orgSlug: string,
  botSlug: string,
  documentId: string | null,
) {
  return useQuery({
    ...fetchDataDetailsQueryOptions(orgSlug, botSlug, documentId ?? ""),
    enabled: documentId !== null,
  });
}

export function useUpdateDataContentMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { documentId: string; markdown: string }) =>
      updateDataContent(orgSlug, botSlug, input.documentId, input.markdown),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: fetchDataQueryKey(orgSlug, botSlug),
        }),
        queryClient.invalidateQueries({
          queryKey: fetchDataDetailsQueryKey(
            orgSlug,
            botSlug,
            variables.documentId,
          ),
        }),
      ]);
    },
  });
}

export function useDeleteDataMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      deleteData(orgSlug, botSlug, documentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: fetchDataQueryKey(orgSlug, botSlug),
        }),
        queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) }),
      ]);
    },
  });
}

export function useDeleteManyDataMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentIds: string[]) =>
      deleteManyData(orgSlug, botSlug, documentIds),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: fetchDataQueryKey(orgSlug, botSlug),
        }),
        queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) }),
      ]);
    },
  });
}
