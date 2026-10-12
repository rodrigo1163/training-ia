import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { FileInterceptor } from '@nestjs/platform-express';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

@Controller('organization/:organizationSlug/bots/:botSlug/upload-pdf-bot')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: MAX_PDF_SIZE,
      files: 1,
    },
  }),
)
export class UploadPdfBotController {
  constructor(private readonly uploadPdf: UploadBotPdfUseCase) {}

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
    @Param('organizationSlug') organizationSlug: string,
    @Param('botSlug') botSlug: string,
    @Session() session: UserSession,
  ) {
    const result = await this.uploadPdf.execute({
      organizationSlug,
      botSlug,
      userId: session.user.id,
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
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      documentId: result.value.documentId,
    };
  }
}
