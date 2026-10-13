import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { FetchDataPresenter } from '@/infra/http/presenters/fetch-data-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class FetchDataController {
  constructor(private readonly fetchData: FetchDataUseCase) {}

  @Get()
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.fetchData.execute({
      organizationMember,
      botSlug,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }

      throw new ForbiddenException();
    }

    return {
      documents: result.value.documents.map(FetchDataPresenter.toHTTP),
    };
  }
}
