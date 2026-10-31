import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import type { Bot } from '../../enterprise/entities/bot';
import { BotRepository } from '../repositories/bot-repository';
import { Uploader } from '../storage/uploader';

type RemoveBotAvatarResponse = Either<ResourceNotFoundError, { bot: Bot }>;

@Injectable()
export class RemoveBotAvatarUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly uploader: Uploader,
  ) {}

  async execute(input: {
    organizationMember: OrganizationMember;
    botSlug: string;
  }): Promise<RemoveBotAvatarResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      input.botSlug,
      input.organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    const previousStorageKey = bot.chatConfig.avatarStorageKey;
    const configError = bot.updateChatConfig({
      avatarUrl: null,
      avatarStorageKey: null,
    });
    if (configError) throw configError;

    await this.bots.update(bot);

    if (previousStorageKey) {
      await this.uploader.deleteObject({ key: previousStorageKey });
    }

    return right({ bot });
  }
}
