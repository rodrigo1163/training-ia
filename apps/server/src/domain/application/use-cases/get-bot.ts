import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import type { Bot } from '../../enterprise/entities/bot.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

type Response = Either<ResourceNotFoundError, { bot: Bot }>;

@Injectable()
export class GetBotUseCase {
  constructor(
    private readonly bots: BotRepository,
  ) {}

  async execute(input: {
    organizationMember: OrganizationMember;
    botSlug: string;
  }): Promise<Response> {
    const bot = await this.bots.findBySlugAndOrgId(
      input.botSlug,
      input.organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    return right({ bot });
  }
}
