import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  InvalidAvatarFileError,
  MAX_AVATAR_FILE_SIZE,
} from '@/domain/application/use-cases/errors/invalid-avatar-file-error';
import { UploadOrganizationLogoUseCase } from '@/domain/application/use-cases/upload-organization-logo';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

@Controller('organization/:orgSlug/logo')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_AVATAR_FILE_SIZE, files: 1 },
  }),
)
export class UploadOrganizationLogoController {
  constructor(private readonly uploadLogo: UploadOrganizationLogoUseCase) {}

  @Post()
  async handle(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Param('orgSlug') orgSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    if (!file) throw new BadRequestException('Avatar file is required.');

    const result = await this.uploadLogo.execute({
      organizationMember,
      orgSlug,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidAvatarFileError) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unable to upload the avatar.');
    }

    return result.value;
  }
}
