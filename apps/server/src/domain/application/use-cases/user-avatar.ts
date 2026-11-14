import { randomUUID } from 'node:crypto';

export const USER_AVATAR_PUBLIC_PATH = '/public/account/avatar';

export const userAvatarContentTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type UserAvatarContentType = (typeof userAvatarContentTypes)[number];

export function isUserAvatarContentType(
  value: string,
): value is UserAvatarContentType {
  return userAvatarContentTypes.includes(value as UserAvatarContentType);
}

export function getUserAvatarExtension(contentType: UserAvatarContentType) {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
  }
}

export function createUserAvatarStorageKey(
  userId: string,
  contentType: UserAvatarContentType,
) {
  return `user-avatars/${userId}/${randomUUID()}.${getUserAvatarExtension(contentType)}`;
}

export function isUserAvatarStorageKey(value: string): boolean {
  return /^user-avatars\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/.test(
    value,
  );
}

export function isUserAvatarStorageKeyForUser(
  value: string,
  userId: string,
): boolean {
  return (
    value.startsWith(`user-avatars/${userId}/`) && isUserAvatarStorageKey(value)
  );
}
