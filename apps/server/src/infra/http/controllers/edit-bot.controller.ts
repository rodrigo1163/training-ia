import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { botPersonalities } from '@/domain/enterprise/entities/bot';
import { EditBotUseCase } from '@/domain/application/use-cases/edit-bot';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';

const editBotBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable(),
  personality: z.enum(botPersonalities),
  language: z.string().trim().min(2).max(20),
  systemMessage: z.string().trim().max(10000).nullable(),
});

type EditBotBody = z.infer<typeof editBotBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(editBotBodySchema);

@Controller('organization/:orgSlug/bots')
@UseGuards(OrganizationGuard)
export class EditBotController {
  constructor(private readonly editBot: EditBotUseCase) {}

  @Patch(':botSlug')
  async handle(
    @Param('botSlug') botSlug: string,
    @Body(bodyValidationPipe) body: EditBotBody,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.editBot.execute({
      organizationMember,
      botSlug,
      name: body.name,
      description: body.description,
      personality: body.personality,
      language: body.language,
      systemMessage: body.systemMessage,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
