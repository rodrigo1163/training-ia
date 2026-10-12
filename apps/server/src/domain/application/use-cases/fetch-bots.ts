import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import type { Bot } from '../../enterprise/entities/bot.js';

type Response = Either<NotAllowedError, { bots: Bot[] }>;

@Injectable()
export class FetchBotsUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async execute(input: {
    orgSlug: string;
    userId: string;
  }): Promise<Response> {
    const organizationMember = await this.organizationMembers.findByOrgSlugAndUserId(
      input.orgSlug,
      input.userId,
    );
    if (!organizationMember) return left(new NotAllowedError());

    return right({
      bots: await this.bots.findManyByOrgId(
        organizationMember.orgId.toString(),
      ),
    });
  }
}
