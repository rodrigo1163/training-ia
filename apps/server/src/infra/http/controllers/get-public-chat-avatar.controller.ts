import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Uploader } from '@/domain/application/storage/uploader';
import { isAvatarStorageKey } from '@/domain/enterprise/entities/chat-config';

@Controller('public/chat/avatar')
@AllowAnonymous()
export class GetPublicChatAvatarController {
  constructor(private readonly uploader: Uploader) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async handle(@Query('key') key: string | undefined) {
    if (!key || !isAvatarStorageKey(key)) {
      throw new NotFoundException();
    }

    try {
      const object = await this.uploader.download({ key });
      return new StreamableFile(object.body, {
        type: object.contentType ?? 'image/webp',
      });
    } catch {
      throw new NotFoundException();
    }
  }
}
