import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { FetchDataPresenter } from '@/infra/http/presenters/fetch-data-presenter';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { RequireActiveOrg, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@RequireActiveOrg()
@Controller('organization/:organizationSlug/fetch-data')
export class FetchDataController {
  constructor(private readonly fetchData: FetchDataUseCase) {}

  @Get()
  async handle(
    @Param('organizationSlug') organizationSlug: string,
    @Session() session: UserSession,
  ) {
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.fetchData.execute({
      organizationSlug,
      activeOrganizationId,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }

      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message);
      }

      throw new ForbiddenException();
    }

    return {
      value: result.value.documents.map(FetchDataPresenter.toHTTP),
    };
  }
}
