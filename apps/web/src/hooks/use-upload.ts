import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadFile } from "@/api/bots/upload-file";
import { uploadWebsite } from "@/api/bots/upload-website";

import { botsQueryKey } from "./use-bots";
import { fetchDataQueryKey } from "./use-fetch-data";

export type UploadFileMutationInput = {
  file: File;
  onProgress?: (progress: number) => void;
};

export function useUploadFileMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadFileMutationInput) =>
      uploadFile(orgSlug, botSlug, file, onProgress),
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

export function useUploadWebsiteMutation(orgSlug: string, botSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => uploadWebsite(orgSlug, botSlug, url),
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
