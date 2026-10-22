import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { UploadBotDocxUseCase } from '@/domain/application/use-cases/upload-bot-docx';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_DOCX_SIZE = 10 * 1024 * 1024;

@Controller('organization/:orgSlug/bots/:botSlug/upload-docx-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_DOCX_SIZE, files: 1 },
  }),
)
export class UploadDocxBotController {
  constructor(private readonly uploadDocx: UploadBotDocxUseCase) {}

  @Post()
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_DOCX_SIZE }),
          new FileTypeValidator({ fileType: new RegExp(`^${DOCX_CONTENT_TYPE}$`) }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadDocx.execute({
      organizationMember,
      botSlug,
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return { documentId: result.value.document.id.toString() };
  }
}
