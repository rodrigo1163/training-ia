import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { editDeployment } from "@/api/bots/edit-deployment";
import { fetchDeployment } from "@/api/bots/fetch-deployment";
import { publishDeployment } from "@/api/bots/publish-deployment";

export const deploymentQueryKey = (orgSlug: string, botSlug: string) =>
  ["bot-deployment", orgSlug, botSlug] as const;

export function deploymentQueryOptions(orgSlug: string, botSlug: string) {
  return queryOptions({
    queryKey: deploymentQueryKey(orgSlug, botSlug),
    queryFn: () => fetchDeployment(orgSlug, botSlug),
  });
}

export function useDeploymentQuery(orgSlug: string, botSlug: string) {
  return useQuery(deploymentQueryOptions(orgSlug, botSlug));
}

type DeploymentMutationInput = {
  action: "publish" | "save" | "toggle";
  allowedOrigins?: string[];
  status?: "ACTIVE" | "INACTIVE";
};

export function useDeploymentMutation(
  orgSlug: string,
  botSlug: string,
  currentStatus?: "ACTIVE" | "INACTIVE",
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeploymentMutationInput) => {
      if (input.action === "publish") {
        return publishDeployment(
          orgSlug,
          botSlug,
          input.allowedOrigins ?? [],
        );
      }

      if (input.action === "save") {
        return editDeployment(orgSlug, botSlug, {
          allowedOrigins: input.allowedOrigins ?? [],
        });
      }

      return editDeployment(orgSlug, botSlug, {
        status:
          input.status ??
          (currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
      });
    },
    onSuccess: async (deployment) => {
      queryClient.setQueryData(
        deploymentQueryKey(orgSlug, botSlug),
        deployment,
      );
      await queryClient.invalidateQueries({
        queryKey: deploymentQueryKey(orgSlug, botSlug),
      });
    },
  });
}
