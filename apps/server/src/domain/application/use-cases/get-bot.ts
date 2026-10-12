import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import type { Bot } from '../../enterprise/entities/bot.js';

type Response = Either<ResourceNotFoundError | NotAllowedError, { bot: Bot }>;

@Injectable()
export class GetBotUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async execute(input: {
    orgSlug: string;
    userId: string;
    botSlug: string;
  }): Promise<Response> {
    const organizationMember = await this.organizationMembers.findByOrgSlugAndUserId(
      input.orgSlug,
      input.userId,
    );
    if (!organizationMember) return left(new NotAllowedError());
    const bot = await this.bots.findBySlugAndOrgId(
      input.botSlug,
      organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    return right({ bot });
  }
}
