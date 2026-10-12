import { BotAlreadyExistsError } from '@/core/errors/errors/bot-already-exists-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { CreateBotUseCase } from '@/domain/application/use-cases/create-bot';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Param,
  Post,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import z from 'zod';

const createBotBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

type CreateBotBody = z.infer<typeof createBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(createBotBodySchema);

@Controller('organization/:orgSlug/bots')
export class CreateBotController {
  constructor(private readonly createBot: CreateBotUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateBotBody,
    @Param('orgSlug') orgSlug: string,
    @Session() session: UserSession,
  ) {
    const result = await this.createBot.execute({
      orgSlug,
      userId: session.user.id,
      name: body.name,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        case BotAlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
