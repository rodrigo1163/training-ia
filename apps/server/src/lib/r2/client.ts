import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Readable } from 'node:stream'

import { env } from '../../env.js'

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export async function presignPut(input: {
  key: string
  contentType: string
  expiresInSeconds?: number
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  })

  return getSignedUrl(s3, command, {
    expiresIn: input.expiresInSeconds ?? env.R2_PRESIGNED_URL_TTL_SECONDS,
  })
}

export async function headObject(key: string) {
  return s3.send(
    new HeadObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    }),
  )
}

export async function getObjectStream(key: string): Promise<Readable> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    }),
  )

  if (!response.Body) {
    throw new Error('R2_OBJECT_EMPTY')
  }

  return response.Body as Readable
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    }),
  )
}
