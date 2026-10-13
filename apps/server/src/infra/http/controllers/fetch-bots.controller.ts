import { FetchBotsUseCase } from '@/domain/application/use-cases/fetch-bots';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots')
@UseGuards(OrganizationGuard)
export class FetchBotsController {
  constructor(private readonly fetchBots: FetchBotsUseCase) {}

  @Get()
  async handle(
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.fetchBots.execute({
      organizationMember,
    });

    return { bots: result.value.bots.map(BotPresenter.toHTTP) };
  }
}
