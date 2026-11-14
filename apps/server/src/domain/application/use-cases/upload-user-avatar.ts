import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UserProfileUpdater } from '../auth/user-profile-updater';
import { Uploader } from '../storage/uploader';
import { InvalidAvatarFileError, inspectAvatarImage } from './avatar-image';
import {
  createUserAvatarStorageKey,
  USER_AVATAR_PUBLIC_PATH,
} from './user-avatar';

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
    let imageInfo;
    try {
      imageInfo = inspectAvatarImage(body, fileType, size);
    } catch (error) {
      if (error instanceof InvalidAvatarFileError) return left(error);
      throw error;
    }

    const storageKey = createUserAvatarStorageKey(
      userId,
      imageInfo.contentType,
    );

    await this.uploader.upload({
      key: storageKey,
      contentType: imageInfo.contentType,
      body,
    });

    const imageUrl = this.uploader.publicUrl({
      fallbackPath: USER_AVATAR_PUBLIC_PATH,
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
