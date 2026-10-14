import {
  DeleteObjectParams,
  DownloadObjectParams,
  DownloadObjectResult,
  Uploader,
  UploadParams,
} from '../../src/domain/application/storage/uploader.js';

export class FakeUploader implements Uploader {
  public uploads: UploadParams[] = [];
  public deletedKeys: string[] = [];

  async upload(params: UploadParams): Promise<void> {
    this.uploads.push(params);
  }

  async deleteObject({ key }: DeleteObjectParams): Promise<void> {
    this.deletedKeys.push(key);
  }

  async download({ key }: DownloadObjectParams): Promise<DownloadObjectResult> {
    const upload = this.uploads.find((item) => item.key === key);

    if (!upload) {
      throw new Error('Arquivo não encontrado.');
    }

    return {
      body: upload.body,
      contentType: upload.contentType,
    };
  }
}
