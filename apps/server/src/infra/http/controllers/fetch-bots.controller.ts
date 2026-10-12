import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { FetchBotsUseCase } from '@/domain/application/use-cases/fetch-bots';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('organization/:orgSlug/bots')
export class FetchBotsController {
  constructor(private readonly fetchBots: FetchBotsUseCase) {}

  @Get()
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Session() session: UserSession,
  ) {
    const result = await this.fetchBots.execute({
      orgSlug,
      userId: session.user.id,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { bots: result.value.bots.map(BotPresenter.toHTTP) };
  }
}
