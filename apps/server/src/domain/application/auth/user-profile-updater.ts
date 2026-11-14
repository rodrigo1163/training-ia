export interface UpdateUserImageRequest {
  image: string;
  headers: Headers;
}

export interface UpdateUserImageResponse {
  headers: Headers;
}

export abstract class UserProfileUpdater {
  abstract updateImage(
    request: UpdateUserImageRequest,
  ): Promise<UpdateUserImageResponse>;
}
