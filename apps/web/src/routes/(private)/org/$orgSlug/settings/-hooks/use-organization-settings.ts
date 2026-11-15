import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import {
  uploadOrganizationLogo,
  type UploadOrganizationLogoResponse,
} from "@/api/organization/upload-logo";
import { authClient } from "@/lib/auth-client";

export const ORGANIZATION_LOGO_MAX_SIZE = 2 * 1024 * 1024;
export const ORGANIZATION_LOGO_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type OrganizationLogoContentType =
  (typeof ORGANIZATION_LOGO_CONTENT_TYPES)[number];

function isOrganizationLogoContentType(
  value: string,
): value is OrganizationLogoContentType {
  return ORGANIZATION_LOGO_CONTENT_TYPES.includes(
    value as OrganizationLogoContentType,
  );
}

function validateOrganizationLogoFile(file: File): void {
  if (!isOrganizationLogoContentType(file.type)) {
    throw new Error("Logo must be a PNG, JPG, JPEG, or WebP image.");
  }

  if (file.size <= 0 || file.size > ORGANIZATION_LOGO_MAX_SIZE) {
    throw new Error("Logo files must be at most 2 MB.");
  }
}

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

export function useUploadOrganizationLogoMutation(orgSlug: string) {
  const router = useRouter();

  return useMutation<UploadOrganizationLogoResponse, Error, File>({
    mutationFn: async (file) => {
      validateOrganizationLogoFile(file);
      return uploadOrganizationLogo(orgSlug, file);
    },
    onSuccess: () => router.invalidate({ sync: true }),
  });
}
