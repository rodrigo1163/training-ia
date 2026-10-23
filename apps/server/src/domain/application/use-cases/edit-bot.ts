import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { BotRepository } from '../repositories/bot-repository';
import { Bot, type BotPersonality } from '../../enterprise/entities/bot';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

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
  constructor(private readonly bots: BotRepository) { }

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

    bot.name = name;
    bot.description = description;
    bot.personality = personality;
    bot.language = language;
    bot.systemMessage = systemMessage;

    await this.bots.update(bot);

    return right({ bot });
  }
}
