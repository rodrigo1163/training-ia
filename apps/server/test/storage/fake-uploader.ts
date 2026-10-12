import {
  DeleteObjectParams,
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
}
