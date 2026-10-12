import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeleteDataUseCase } from '@/domain/application/use-cases/delete-data';
import {
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

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
export class DeleteDataController {
  constructor(private readonly deleteData: DeleteDataUseCase) {}

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    const result = await this.deleteData.execute({
      orgSlug,
      botSlug,
      userId: session.user.id,
      documentId,
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
