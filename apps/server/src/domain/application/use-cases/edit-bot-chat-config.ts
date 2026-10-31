import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import {
  InvalidChatConfigError,
  type ChatConfigPatch,
} from '../../enterprise/entities/chat-config';
import type { Bot } from '../../enterprise/entities/bot';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { BotRepository } from '../repositories/bot-repository';

interface EditBotChatConfigUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  patch: ChatConfigPatch;
}

type EditBotChatConfigUseCaseResponse = Either<
  ResourceNotFoundError | InvalidChatConfigError,
  { bot: Bot }
>;

@Injectable()
export class EditBotChatConfigUseCase {
  constructor(private readonly bots: BotRepository) {}

  async execute({
    organizationMember,
    botSlug,
    patch,
  }: EditBotChatConfigUseCaseRequest): Promise<EditBotChatConfigUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) return left(new ResourceNotFoundError());

    try {
      bot.updateChatConfig(patch);
    } catch (error) {
      if (error instanceof InvalidChatConfigError) {
        return left(error);
      }

      throw error;
    }

    await this.bots.update(bot);

    return right({ bot });
  }
}
