import { BotNotEmptyError } from '@/core/errors/errors/bot-not-empty-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeleteBotUseCase } from '@/domain/application/use-cases/delete-bot';
import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('organization/:organizationSlug/bots')
export class DeleteBotController {
  constructor(private readonly deleteBot: DeleteBotUseCase) {}

  @Delete(':botSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('organizationSlug') organizationSlug: string,
    @Param('botSlug') botSlug: string,
    @Session() session: UserSession,
  ): Promise<void> {
    const result = await this.deleteBot.execute({
      organizationSlug,
      botSlug,
      userId: session.user.id,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        case BotNotEmptyError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
