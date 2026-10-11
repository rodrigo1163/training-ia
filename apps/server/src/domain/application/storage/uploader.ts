export interface PresignedUpload {
  url: string;
  expiresAt: Date;
  method: "PUT";
  headers: Record<string, string>;
}

export abstract class Uploader {
  abstract createPresignedUpload(input: {
    key: string;
    contentType: string;
    expiresIn: number;
  }): Promise<PresignedUpload>;
}
