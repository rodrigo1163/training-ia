
import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DocumentStorage, PresignedUpload } from "@/domain/application/storage/presigner-upload";



@Injectable()
export class R2DocumentStorage implements DocumentStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET!;

    this.client = new S3Client({
      region: "auto",
      endpoint:
        `https://${process.env.R2_ACCOUNT_ID}` +
        `.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    expiresIn: number;
  }): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
    });

    const url = await getSignedUrl(
      this.client,
      command,
      { expiresIn: input.expiresIn },
    );

    return {
      url,
      method: "PUT",
      headers: {
        "Content-Type": input.contentType,
      },
      expiresAt: new Date(
        Date.now() + input.expiresIn * 1000,
      ),
    };
  }
}
