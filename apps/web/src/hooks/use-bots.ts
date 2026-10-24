import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBot } from "@/api/bots/create-bot";
import { deleteBot } from "@/api/bots/delete-bot";
import { editBot } from "@/api/bots/edit-bot";
import { fetchBot } from "@/api/bots/fetch-bot";
import { fetchBots } from "@/api/bots/fetch-bots";
import type { EditBotInput } from "@/api/bots/types";

export const botsQueryKey = (orgSlug: string) => ["bots", orgSlug] as const;
export const botQueryKey = (orgSlug: string, botSlug: string) =>
  ["bot", orgSlug, botSlug] as const;

export function botsQueryOptions(orgSlug: string) {
  return queryOptions({
    queryKey: botsQueryKey(orgSlug),
    queryFn: () => fetchBots(orgSlug),
  });
}

export function botQueryOptions(orgSlug: string, botSlug: string) {
  return queryOptions({
    queryKey: botQueryKey(orgSlug, botSlug),
    queryFn: () => fetchBot(orgSlug, botSlug),
  });
}

export function useBotsQuery(orgSlug: string) {
  return useQuery(botsQueryOptions(orgSlug));
}

export function useBotQuery(orgSlug: string, botSlug: string) {
  return useQuery(botQueryOptions(orgSlug, botSlug));
}

export function useCreateBotMutation(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createBot(orgSlug, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) }),
  });
}

export function useEditBotMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditBotInput) => editBot(orgSlug, botSlug, input),
    onSuccess: async (bot) => {
      queryClient.setQueryData(botQueryKey(orgSlug, botSlug), bot);
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
    },
  });
}

export function useDeleteBotMutation(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (botSlug: string) => deleteBot(orgSlug, botSlug),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) }),
  });
}
