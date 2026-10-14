import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import {
  DeleteObjectParams,
  DownloadObjectParams,
  DownloadObjectResult,
  Uploader,
  UploadParams,
} from '@/domain/application/storage/uploader';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class R2Storage implements Uploader {
  private client: S3Client;

  constructor(private envService: EnvService) {
    const accountId = envService.get('CLOUDFLARE_ACCOUNT_ID');

    this.client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload({ key, contentType, body }: UploadParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.envService.get('AWS_BUCKET_NAME'),
        Key: key,
        ContentType: contentType,
        Body: body,
      }),
    );
  }

  async deleteObject({ key }: DeleteObjectParams): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.envService.get('AWS_BUCKET_NAME'),
        Key: key,
      }),
    );
  }

  async download({ key }: DownloadObjectParams): Promise<DownloadObjectResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.envService.get('AWS_BUCKET_NAME'),
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error('O arquivo não possui conteúdo.');
    }

    return {
      body: Buffer.from(await response.Body.transformToByteArray()),
      contentType: response.ContentType,
    };
  }
}
