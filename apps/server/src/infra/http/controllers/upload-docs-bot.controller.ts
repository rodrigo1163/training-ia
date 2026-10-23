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
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { UploadBotDocsUseCase } from '@/domain/application/use-cases/upload-bot-docs';
import type { UploadBotDocInput } from '@/domain/application/use-cases/upload-bot-docs';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

const MAX_DOC_SIZE = 10 * 1024 * 1024;
const MAX_DOC_FILES = 5;

@Controller('organization/:orgSlug/bots/:botSlug/upload-docs-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FilesInterceptor('files', MAX_DOC_FILES, {
    limits: { fileSize: MAX_DOC_SIZE, files: MAX_DOC_FILES },
  }),
)
export class UploadDocsBotController {
  constructor(private readonly uploadDocs: UploadBotDocsUseCase) {}

  @Post()
  async handle(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        `You can upload between 1 and ${MAX_DOC_FILES} documents`,
      );
    }

    const inputs: UploadBotDocInput[] = files.map((file) => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    }));
    const result = await this.uploadDocs.execute({
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
