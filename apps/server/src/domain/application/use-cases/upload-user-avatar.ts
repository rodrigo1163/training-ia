import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UserProfileUpdater } from '../auth/user-profile-updater';
import { Uploader } from '../storage/uploader';
import {
  InvalidAvatarFileError,
  MAX_AVATAR_FILE_SIZE,
} from './errors/invalid-avatar-file-error';

export class UserAvatarProfileUpdateError extends Error {
  constructor() {
    super('Unable to save the avatar to the user profile.');
  }
}

export interface UploadUserAvatarRequest {
  userId: string;
  fileType: string;
  size: number;
  body: Buffer;
  headers: Headers;
}

export interface UploadUserAvatarResponse {
  imageUrl: string;
  headers: Headers;
}

type Response = Either<
  InvalidAvatarFileError | UserAvatarProfileUpdateError,
  UploadUserAvatarResponse
>;

@Injectable()
export class UploadUserAvatarUseCase {
  constructor(
    private readonly uploader: Uploader,
    private readonly userProfileUpdater: UserProfileUpdater,
  ) {}

  async execute({
    userId,
    fileType,
    size,
    body,
    headers,
  }: UploadUserAvatarRequest): Promise<Response> {
    const contentType = fileType === 'image/jpg' ? 'image/jpeg' : fileType;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
      return left(
        new InvalidAvatarFileError(
          'Avatar must be a PNG, JPG, JPEG, or WebP image.',
        ),
      );
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_AVATAR_FILE_SIZE ||
      body.byteLength !== size
    ) {
      return left(
        new InvalidAvatarFileError('Avatar files must be at most 2 MB.'),
      );
    }

    const extension =
      contentType === 'image/jpeg' ? 'jpg' : contentType.slice(6);
    const storageKey = `user-avatars/${userId}/${randomUUID()}.${extension}`;

    await this.uploader.upload({
      key: storageKey,
      contentType,
      body,
    });

    const imageUrl = this.uploader.publicUrl({
      fallbackPath: '/public/account/avatar',
      key: storageKey,
    });

    try {
      const update = await this.userProfileUpdater.updateImage({
        headers,
        image: imageUrl,
      });

      return right({
        headers: update.headers,
        imageUrl,
      });
    } catch {
      try {
        await this.uploader.deleteObject({ key: storageKey });
      } catch {
        // Keep the profile error as the operation result even if cleanup fails.
      }

      return left(new UserAvatarProfileUpdateError());
    }
  }
}
