import { BotAlreadyExistsError } from '@/core/errors/errors/bot-already-exists-error';
import { CreateBotUseCase } from '@/domain/application/use-cases/create-bot';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { botPersonalities } from '@/domain/enterprise/entities/bot';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';

const createBotBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable().optional(),
  personality: z.enum(botPersonalities).optional(),
  language: z.string().trim().min(2).max(20).optional(),
  systemMessage: z.string().trim().max(10000).nullable().optional(),
});

type CreateBotBody = z.infer<typeof createBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(createBotBodySchema);

@Controller('organization/:orgSlug/bots')
@UseGuards(OrganizationGuard)
export class CreateBotController {
  constructor(private readonly createBot: CreateBotUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateBotBody,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.createBot.execute({
      organizationMember,
      name: body.name,
      description: body.description,
      personality: body.personality,
      language: body.language,
      systemMessage: body.systemMessage,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case BotAlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
