import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type {
  InvalidChatConfigError,
  ChatConfig,
} from '../../enterprise/entities/chat-config';
import { normalizeChatConfigPatch } from '../../enterprise/entities/chat-config';
import type { InvalidBotStyleError } from '../../enterprise/entities/bot-style';
import { validateBotStyle } from '../../enterprise/entities/bot-style';
import type { Bot, BotChatConfigPatch } from '../../enterprise/entities/bot';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { BotRepository } from '../repositories/bot-repository';
import { validateChatGenerationConfig } from '../ai/chat-generation-config';

interface EditBotChatConfigUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  patch: BotChatConfigPatch;
}

type EditBotChatConfigUseCaseResponse = Either<
  ResourceNotFoundError | InvalidChatConfigError | InvalidBotStyleError,
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

    const { style, ...chatConfigInput } = patch;
    const normalizedPatch = normalizeChatConfigPatch(chatConfigInput);
    const nextChatConfig: ChatConfig = {
      ...bot.chatConfig,
      ...normalizedPatch,
    };
    const generationError = validateChatGenerationConfig(nextChatConfig);

    if (generationError) return left(generationError);

    if (style) {
      const styleError = validateBotStyle(style);
      if (styleError) return left(styleError);
    }

    const error = bot.updateChatConfig(normalizedPatch);
    if (error) return left(error);

    if (style) {
      const styleError = bot.updateStyle(style);
      if (styleError) return left(styleError);
    }

    await this.bots.update(bot);

    return right({ bot });
  }
}
