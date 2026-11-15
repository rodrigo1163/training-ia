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

@Controller('public/organization/logo')
@AllowAnonymous()
export class GetPublicOrganizationLogoController {
  constructor(private readonly uploader: Uploader) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async handle(@Query('key') key: string | undefined) {
    if (
      !key ||
      !/^organization-logos\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/.test(
        key,
      )
    ) {
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
