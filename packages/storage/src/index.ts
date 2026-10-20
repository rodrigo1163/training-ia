import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export interface R2StorageConfig {
  accountId: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export interface UploadObjectParams {
  key: string
  contentType: string
  body: Buffer
}

export interface ObjectKeyParams {
  key: string
}

export interface DownloadObjectResult {
  body: Buffer
  contentType?: string
}

export class R2Storage {
  private readonly client: S3Client

  constructor(private readonly config: R2StorageConfig) {
    this.client = new S3Client({
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async upload({ key, contentType, body }: UploadObjectParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: contentType,
        Body: body,
      }),
    )
  }

  async deleteObject({ key }: ObjectKeyParams): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    )
  }

  async download({ key }: ObjectKeyParams): Promise<DownloadObjectResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    )

    if (!response.Body) {
      throw new Error(`Storage object ${key} has no body`)
    }

    return {
      body: Buffer.from(await response.Body.transformToByteArray()),
      contentType: response.ContentType,
    }
  }
}
