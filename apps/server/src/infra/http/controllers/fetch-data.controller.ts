import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { FetchDataPresenter } from '@/infra/http/presenters/fetch-data-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  Controller,
  BadRequestException,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class FetchDataController {
  constructor(private readonly fetchData: FetchDataUseCase) {}

  @Get()
  async handle(
    @Param('botSlug') botSlug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(5), ParseIntPipe) pageSize: number,
    @Query('search') search: string | undefined,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.fetchData.execute({
      organizationMember,
      botSlug,
      pagination: {
        page: Math.max(page, 1),
        pageSize: Math.max(pageSize, 1),
      },
      search,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    return {
      documents: result.value.items.map(FetchDataPresenter.toHTTP),
      totalSize: result.value.totalSize,
      pagination: {
        page: Math.max(page, 1),
        pageSize: Math.max(pageSize, 1),
        totalItems: result.value.totalItems,
      },
    };
  }
}
