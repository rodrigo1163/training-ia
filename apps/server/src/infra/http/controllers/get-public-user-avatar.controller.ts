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
import { isUserAvatarStorageKey } from '@/domain/application/use-cases/user-avatar';

@Controller('public/account/avatar')
@AllowAnonymous()
export class GetPublicUserAvatarController {
  constructor(private readonly uploader: Uploader) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async handle(@Query('key') key: string | undefined) {
    if (!key || !isUserAvatarStorageKey(key)) {
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
