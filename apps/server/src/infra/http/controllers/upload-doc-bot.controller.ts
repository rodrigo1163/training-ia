import {
  BadRequestException,
  Controller,
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
import { UploadBotDocUseCase } from '@/domain/application/use-cases/upload-bot-doc';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

const MAX_DOC_SIZE = 10 * 1024 * 1024;

@Controller('organization/:orgSlug/bots/:botSlug/upload-doc-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_DOC_SIZE, files: 1 },
  }),
)
export class UploadDocBotController {
  constructor(private readonly uploadDoc: UploadBotDocUseCase) {}

  @Post()
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_DOC_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadDoc.execute({
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
