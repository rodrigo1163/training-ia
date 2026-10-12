export interface UploadParams {
  key: string;
  contentType: string;
  body: Buffer;
}

export interface DeleteObjectParams {
  key: string;
}

export abstract class Uploader {
  abstract upload(params: UploadParams): Promise<void>;

  abstract deleteObject(params: DeleteObjectParams): Promise<void>;
}
