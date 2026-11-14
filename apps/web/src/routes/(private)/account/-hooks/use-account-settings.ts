import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import {
  uploadAvatar,
  type UploadAvatarResponse,
} from "@/api/account/upload-avatar";
import { authClient } from "@/lib/auth-client";

export const ACCOUNT_AVATAR_MAX_SIZE = 2 * 1024 * 1024;
export const ACCOUNT_AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AccountAvatarContentType = (typeof ACCOUNT_AVATAR_CONTENT_TYPES)[number];

function isAccountAvatarContentType(
  value: string,
): value is AccountAvatarContentType {
  return ACCOUNT_AVATAR_CONTENT_TYPES.includes(
    value as AccountAvatarContentType,
  );
}

function validateAvatarFile(file: File): AccountAvatarContentType {
  if (!isAccountAvatarContentType(file.type)) {
    throw new Error("Avatar must be a PNG, JPG, JPEG, or WebP image.");
  }

  if (file.size <= 0 || file.size > ACCOUNT_AVATAR_MAX_SIZE) {
    throw new Error("Avatar files must be at most 2 MB.");
  }

  return file.type;
}

export function useUpdateDisplayNameMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await authClient.updateUser({ name });

      if (result.error) {
        throw new Error(result.error.message ?? "Unable to update your name.");
      }
    },
    onSuccess: () => router.invalidate({ sync: true }),
  });
}

export function useUploadAccountAvatarMutation() {
  const router = useRouter();

  return useMutation<UploadAvatarResponse, Error, File>({
    mutationFn: async (file) => {
      validateAvatarFile(file);
      return uploadAvatar(file);
    },
    onSuccess: () => router.invalidate({ sync: true }),
  });
}
