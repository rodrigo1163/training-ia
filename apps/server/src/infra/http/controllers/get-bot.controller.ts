import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GetBotUseCase } from '@/domain/application/use-cases/get-bot';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { RequireActiveOrg, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@RequireActiveOrg()
@Controller('organization/:organizationSlug/bots')
export class GetBotController {
  constructor(private readonly getBot: GetBotUseCase) {}

  @Get(':botSlug')
  async handle(
    @Param('organizationSlug') organizationSlug: string,
    @Param('botSlug') botSlug: string,
    @Session() session: UserSession,
  ) {
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.getBot.execute({
      organizationSlug,
      botSlug,
      activeOrganizationId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
