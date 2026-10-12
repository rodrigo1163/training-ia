import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeleteManyDataUseCase } from '@/domain/application/use-cases/delete-many-data';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import z from 'zod';

const deleteManyDataBodySchema = z.object({
  documentIds: z.array(z.string().min(1)).min(1),
});

type DeleteManyDataBody = z.infer<typeof deleteManyDataBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(deleteManyDataBodySchema);

@Controller('organization/:organizationSlug/bots/:botSlug/fetch-data')
export class DeleteManyDataController {
  constructor(private readonly deleteManyData: DeleteManyDataUseCase) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Body(bodyValidationPipe) body: DeleteManyDataBody,
    @Param('organizationSlug') organizationSlug: string,
    @Param('botSlug') botSlug: string,
    @Session() session: UserSession,
  ): Promise<void> {
    const result = await this.deleteManyData.execute({
      organizationSlug,
      botSlug,
      userId: session.user.id,
      documentIds: body.documentIds,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }

      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message);
      }
    }
  }
}
