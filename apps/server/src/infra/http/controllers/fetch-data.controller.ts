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
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const fetchDataQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(5),
  search: z.string().optional(),
});
type FetchDataQuery = z.infer<typeof fetchDataQuerySchema>;
const queryValidationPipe = new ZodValidationPipe(fetchDataQuerySchema);

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class FetchDataController {
  constructor(private readonly fetchData: FetchDataUseCase) {}

  @Get()
  async handle(
    @Param('botSlug') botSlug: string,
    @Query(queryValidationPipe) query: FetchDataQuery,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.fetchData.execute({
      organizationMember,
      botSlug,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
      },
      search: query.search,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    return {
      documents: result.value.items.map(FetchDataPresenter.toHTTP),
      totalSize: result.value.totalSize,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.value.totalItems,
      },
    };
  }
}
