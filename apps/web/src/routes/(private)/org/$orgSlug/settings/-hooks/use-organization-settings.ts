import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

type UpdateOrganizationNameInput = {
  name: string;
  organizationId: string;
};

export function useUpdateOrganizationNameMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      name,
      organizationId,
    }: UpdateOrganizationNameInput) => {
      const result = await authClient.organization.update({
        data: { name },
        organizationId,
      });

      if (result.error) {
        throw new Error(
          result.error.message ?? "Unable to update the organization name.",
        );
      }

      if (!result.data) {
        throw new Error("Unable to update the organization name.");
      }

      return result.data;
    },
    onSuccess: () => router.invalidate({ sync: true }),
  });
}
