import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
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
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { FileInterceptor } from '@nestjs/platform-express';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

@Controller('organization/:orgSlug/bots/:botSlug/upload-pdf-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: MAX_PDF_SIZE,
      files: 1,
    },
  }),
)
export class UploadPdfBotController {
  constructor(
    private readonly uploadPdf: UploadBotPdfUseCase,
  ) {}

  @Post()
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PDF_SIZE }),
          new FileTypeValidator({ fileType: /^application\/pdf$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadPdf.execute({
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

    const documentId = result.value.document.id.toString();

    return { documentId };
  }
}
