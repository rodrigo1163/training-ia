import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { EnvService } from '../../../src/infra/env/env.service.js';

interface StoredObject {
  body: Buffer;
  contentType: string | undefined;
}

export class R2TestStorage {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly trackedKeys = new Set<string>();

  constructor(envService: EnvService) {
    this.bucket = envService.get('AWS_BUCKET_NAME');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${envService.get('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  track(key: string): void {
    this.trackedKeys.add(key);
  }

  async get(key: string): Promise<StoredObject> {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    return {
      body: Buffer.from((await object.Body?.transformToByteArray()) ?? []),
      contentType: object.ContentType,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      if (this.isNotFound(error)) {
        return false;
      }

      throw error;
    }
  }

  async cleanup(): Promise<void> {
    const keys = [...this.trackedKeys];

    await Promise.all(
      keys.map((key) =>
        this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        ),
      ),
    );

    this.trackedKeys.clear();
    this.client.destroy();
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const metadata = Reflect.get(error, '$metadata') as
      { httpStatusCode?: number } | undefined;

    return metadata?.httpStatusCode === 404;
  }
}
