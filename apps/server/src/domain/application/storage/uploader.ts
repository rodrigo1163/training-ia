export interface UploadParams {
  key: string;
  contentType: string;
  body: Buffer;
}

export interface DeleteObjectParams {
  key: string;
}

export interface DownloadObjectParams {
  key: string;
}

export interface DownloadObjectResult {
  body: Buffer;
  contentType?: string;
}

export abstract class Uploader {
  abstract upload(params: UploadParams): Promise<void>;

  abstract deleteObject(params: DeleteObjectParams): Promise<void>;

  abstract download(
    params: DownloadObjectParams,
  ): Promise<DownloadObjectResult>;
}
