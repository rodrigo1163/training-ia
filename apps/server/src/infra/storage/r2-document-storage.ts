
import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PresignedUpload, Uploader } from "@/domain/application/storage/uploader";
import { EnvService } from "@/infra/env/env.service";



@Injectable()
export class R2DocumentStorage implements Uploader {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly envService: EnvService) {
    this.bucket = this.envService.get('AWS_BUCKET_NAME');

    this.client = new S3Client({
      region: "auto",
      endpoint:
        `https://${this.envService.get('CLOUDFLARE_ACCOUNT_ID')}` +
        `.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
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
