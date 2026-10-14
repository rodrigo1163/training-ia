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
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadBotTxtUseCase } from '@/domain/application/use-cases/upload-bot-txt';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';

const MAX_TXT_SIZE = 10 * 1024 * 1024;

@Controller('organization/:orgSlug/bots/:botSlug/upload-txt-bot')
@UseGuards(OrganizationGuard)
@UseInterceptors(
  FileInterceptor('file', { limits: { fileSize: MAX_TXT_SIZE, files: 1 } }),
)
export class UploadTxtBotController {
  constructor(private readonly uploadTxt: UploadBotTxtUseCase) {}

  @Post()
  async handle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_TXT_SIZE }),
          new FileTypeValidator({
            fileType: /^text\/plain$/,
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('botSlug') botSlug: string,
    @Body('text') text: string | undefined,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadTxt.execute({
      organizationMember,
      botSlug,
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      body: file.buffer,
      text: text ?? '',
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }
      throw new BadRequestException(result.value.message);
    }

    return { documentId: result.value.document.id.toString() };
  }
}
