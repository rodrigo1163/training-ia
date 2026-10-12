import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { FetchBotsUseCase } from '@/domain/application/use-cases/fetch-bots';
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
export class FetchBotsController {
  constructor(private readonly fetchBots: FetchBotsUseCase) {}

  @Get()
  async handle(
    @Param('organizationSlug') organizationSlug: string,
    @Session() session: UserSession,
  ) {
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.fetchBots.execute({
      organizationSlug,
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

    return { bots: result.value.bots.map(BotPresenter.toHTTP) };
  }
}
