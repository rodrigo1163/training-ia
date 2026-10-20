import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Bot, type BotPersonality } from '../../enterprise/entities/bot.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

interface EditBotUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  name: string;
  description: string | null;
  personality: BotPersonality;
  language: string;
  systemMessage: string | null;
}

type EditBotUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    bot: Bot;
  }
>;

@Injectable()
export class EditBotUseCase {
  constructor(private readonly bots: BotRepository) {}

  async execute({
    organizationMember,
    botSlug,
    name,
    description,
    personality,
    language,
    systemMessage,
  }: EditBotUseCaseRequest): Promise<EditBotUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const updatedBot = Bot.create(
      {
        orgId: bot.orgId,
        name: bot.name,
        description: bot.description,
        personality: bot.personality,
        language: bot.language,
        systemMessage: bot.systemMessage,
        slug: bot.slug,
        documentCount: bot.documentCount,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
      },
      bot.id,
    );

    updatedBot.name = name;
    updatedBot.description = description;
    updatedBot.personality = personality;
    updatedBot.language = language;
    updatedBot.systemMessage = systemMessage;

    await this.bots.update(updatedBot);

    return right({ bot: updatedBot });
  }
}
