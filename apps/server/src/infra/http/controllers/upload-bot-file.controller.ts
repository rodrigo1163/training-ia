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
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { UploadBotFileUseCase } from '@/domain/application/use-cases/upload-bot-file';
import { getSupportedDocumentExtension } from '@/domain/enterprise/entities/document';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_FILE_TYPES_REGEX =
  /^(application\/(pdf|msword|octet-stream|x-cfb)|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)$/;

@Controller('organization/:orgSlug/bots/:botSlug/upload-file')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  }),
)
export class UploadBotFileController {
  constructor(private readonly uploadFile: UploadBotFileUseCase) {}

  @Post()
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: SUPPORTED_FILE_TYPES_REGEX,
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    if (!getSupportedDocumentExtension(file.originalname)) {
      throw new BadRequestException('Invalid document extension');
    }

    const result = await this.uploadFile.execute({
      organizationMember,
      botSlug,
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { documentId: result.value.document.id.toString() };
  }
}
