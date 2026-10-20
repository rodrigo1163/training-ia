import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadBotTxtsUseCase } from '@/domain/application/use-cases/upload-bot-txts';
import type { UploadBotTxtInput } from '@/domain/application/use-cases/upload-bot-txts';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';

const MAX_TXT_SIZE = 10 * 1024 * 1024;
const MAX_TXT_FILES = 5;

@Controller('organization/:orgSlug/bots/:botSlug/upload-txts-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FilesInterceptor('files', MAX_TXT_FILES, {
    limits: { fileSize: MAX_TXT_SIZE, files: MAX_TXT_FILES },
  }),
)
export class UploadTxtsBotController {
  constructor(private readonly uploadTxts: UploadBotTxtsUseCase) {}

  @Post()
  async handle(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        `You can upload between 1 and ${MAX_TXT_FILES} documents`,
      );
    }

    const inputs: UploadBotTxtInput[] = files.map((file) => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    }));
    const result = await this.uploadTxts.execute({
      organizationMember,
      botSlug,
      files: inputs,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }
      throw new BadRequestException(result.value.message);
    }
    return result.value;
  }
}
