import { CreatePresignedBotPdfUploadUseCase } from '@/domain/application/use-cases/create-presigned-bot-pdf-upload';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { DocumentPresenter } from '@/infra/http/presenters/document-presenter';
import { Body, Controller, Param, Post } from '@nestjs/common';
import z from 'zod';

const uploadPdfBotBodySchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().min(1),
});

type UploadPdfBotBodySchema = z.infer<typeof uploadPdfBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(uploadPdfBotBodySchema);

@Controller('organization/:organizationId/upload-pdf-bot')
export class UploadPdfBotController {
  constructor(
    private readonly requestUpload: CreatePresignedBotPdfUploadUseCase,
  ) { }

  @Post()
  async createUpload(
    @Body(bodyValidationPipe) body: UploadPdfBotBodySchema,
    @Param('organizationId') organizationId: string,
  ) {
    const { contentType, filename, size } = body;
    // Exemplo: deve ser obtido da sessão autenticada
    // e validado contra as permissões do usuário.

    const result = await this.requestUpload.execute({
      organizationId,
      filename,
      contentType,
      size,
    });

    if (result.isLeft()) {
      return result;
    }

    return {
      value: DocumentPresenter.toHTTP(result.value.document),
    };
  }
}
