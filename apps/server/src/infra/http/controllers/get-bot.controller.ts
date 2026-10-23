import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GetBotUseCase } from '@/domain/application/use-cases/get-bot';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots')
@UseGuards(OrganizationGuard)
export class GetBotController {
  constructor(private readonly getBot: GetBotUseCase) {}

  @Get(':botSlug')
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.getBot.execute({
      organizationMember,
      botSlug,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException();
      }
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
