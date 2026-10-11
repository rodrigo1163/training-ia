import { CreatePresignedBotPdfUploadUseCase } from '@/domain/application/use-cases/create-presigned-bot-pdf-upload';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { DocumentPresenter } from '@/infra/http/presenters/document-presenter';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RequireActiveOrg, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import z from 'zod';

const uploadPdfBotBodySchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().min(1),
});

type UploadPdfBotBodySchema = z.infer<typeof uploadPdfBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(uploadPdfBotBodySchema);

@RequireActiveOrg()
@Controller('organization/:organizationSlug/upload-pdf-bot')
export class UploadPdfBotController {
  constructor(
    private readonly requestUpload: CreatePresignedBotPdfUploadUseCase,
  ) {}

  @Post()
  async createUpload(
    @Body(bodyValidationPipe) body: UploadPdfBotBodySchema,
    @Param('organizationSlug') organizationSlug: string,
    @Session() session: UserSession,
  ) {
    const { contentType, filename, size } = body;
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.requestUpload.execute({
      organizationSlug,
      activeOrganizationId,
      filename,
      contentType,
      size,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }

      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message);
      }

      throw new BadRequestException(result.value.message);
    }

    return {
      value: DocumentPresenter.toHTTP(result.value.document),
    };
  }
}
