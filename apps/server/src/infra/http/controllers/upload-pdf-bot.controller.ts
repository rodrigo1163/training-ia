import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  BadRequestException,
  Body,
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
import { InvalidDocumentTextError } from '@/domain/application/use-cases/errors/invalid-document-text-error';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentProcessingPublisher } from '@/infra/messaging/document-processing-publisher';

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
    private readonly documentProcessingPublisher: DocumentProcessingPublisher,
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
    @Body('text') text: string | undefined,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadPdf.execute({
      organizationMember,
      botSlug,
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
      text: text ?? '',
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case InvalidDocumentTextError:
          throw new BadRequestException(error.message);
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const documentId = result.value.document.id.toString();

    await this.documentProcessingPublisher.publish({ documentId });

    return { documentId };
  }
}
