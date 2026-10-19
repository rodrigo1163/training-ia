import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'

import { loadEnv } from '../../config/env.js'

@Injectable()
export class StorageConnection {
  private readonly client: S3Client
  private readonly bucket: string

  constructor() {
    const env = loadEnv()

    this.client = new S3Client({
      endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.bucket = env.AWS_BUCKET_NAME
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )

    if (!response.Body) {
      throw new Error(`Storage object ${key} has no body`)
    }

    return Buffer.from(await response.Body.transformToByteArray())
  }
}
