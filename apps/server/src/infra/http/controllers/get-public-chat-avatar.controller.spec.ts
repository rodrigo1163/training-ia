import { StreamableFile } from '@nestjs/common';
import {
  Uploader,
  type DeleteObjectParams,
  type DownloadObjectParams,
  type DownloadObjectResult,
  type UploadParams,
} from '@/domain/application/storage/uploader';
import { GetPublicChatAvatarController } from './get-public-chat-avatar.controller';

class StubUploader extends Uploader {
  async upload(_params: UploadParams): Promise<void> {}

  async deleteObject(_params: DeleteObjectParams): Promise<void> {}

  publicUrl({ key }: { key: string }): string {
    return `https://storage.example/${key}`;
  }

  async download(_params: DownloadObjectParams): Promise<DownloadObjectResult> {
    return {
      body: Buffer.from('image'),
      contentType: 'image/webp',
    };
  }
}

describe('Get public chat avatar controller', () => {
  it('returns the avatar as a streamable file instead of JSON-serializing the buffer', async () => {
    const controller = new GetPublicChatAvatarController(new StubUploader());

    const result = await controller.handle('chat-avatars/bot-1/avatar.webp');

    expect(result).toBeInstanceOf(StreamableFile);
  });
});
