import { StreamableFile } from '@nestjs/common';

import {
  Uploader,
  type DeleteObjectParams,
  type DownloadObjectParams,
  type DownloadObjectResult,
  type UploadParams,
} from '@/domain/application/storage/uploader';
import { GetPublicOrganizationLogoController } from './get-public-organization-logo.controller';

class StubUploader extends Uploader {
  async upload(_params: UploadParams): Promise<void> {}

  async deleteObject(_params: DeleteObjectParams): Promise<void> {}

  publicUrl({ key }: { key: string; fallbackPath?: string }): string {
    return `https://storage.example/${key}`;
  }

  async download(_params: DownloadObjectParams): Promise<DownloadObjectResult> {
    return {
      body: Buffer.from('image'),
      contentType: 'image/webp',
    };
  }
}

describe('Get public organization logo controller', () => {
  it('returns a streamable file for a valid organization logo key', async () => {
    const controller = new GetPublicOrganizationLogoController(
      new StubUploader(),
    );

    const result = await controller.handle(
      'organization-logos/org-1/logo.webp',
    );

    expect(result).toBeInstanceOf(StreamableFile);
  });
});
