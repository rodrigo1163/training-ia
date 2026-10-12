import { BotAlreadyExistsError } from '@/core/errors/errors/bot-already-exists-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { CreateBotUseCase } from '@/domain/application/use-cases/create-bot';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RequireActiveOrg, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import z from 'zod';

const createBotBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

type CreateBotBody = z.infer<typeof createBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(createBotBodySchema);

@RequireActiveOrg()
@Controller('organization/:organizationSlug/bots')
export class CreateBotController {
  constructor(private readonly createBot: CreateBotUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateBotBody,
    @Param('organizationSlug') organizationSlug: string,
    @Session() session: UserSession,
  ) {
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ForbiddenException('Active organization is required');
    }

    const result = await this.createBot.execute({
      organizationSlug,
      activeOrganizationId,
      name: body.name,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
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
