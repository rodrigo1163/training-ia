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
import { UploadBotPdfsUseCase } from '@/domain/application/use-cases/upload-bot-pdfs';
import type { UploadBotPdfInput } from '@/domain/application/use-cases/upload-bot-pdfs';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_PDF_FILES = 5;

@Controller('organization/:orgSlug/bots/:botSlug/upload-pdfs-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FilesInterceptor('files', MAX_PDF_FILES, {
    limits: {
      fileSize: MAX_PDF_SIZE,
      files: MAX_PDF_FILES,
    },
  }),
)
export class UploadPdfsBotController {
  constructor(private readonly uploadPdfs: UploadBotPdfsUseCase) {}

  @Post()
  async handle(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        `You can upload between 1 and ${MAX_PDF_FILES} documents`,
      );
    }

    const inputs: UploadBotPdfInput[] = (files ?? []).map((file) => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    }));

    const result = await this.uploadPdfs.execute({
      organizationMember,
      botSlug,
      files: inputs,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return result.value;
  }
}
