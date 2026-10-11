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
import { RequireActiveOrg, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@RequireActiveOrg()
@Controller('organization/:organizationSlug/bots/:botSlug/fetch-data')
export class DeleteDataController {
  constructor(private readonly deleteData: DeleteDataUseCase) {}

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('organizationSlug') organizationSlug: string,
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.deleteData.execute({
      organizationSlug,
      botSlug,
      activeOrganizationId,
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
