import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { BotData, BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';

type Response = Either<NotAllowedError, { bots: BotData[] }>;

@Injectable()
export class FetchBotsUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async execute(input: {
    organizationSlug: string;
    userId: string;
  }): Promise<Response> {
    const organizationMember = await this.organizationMembers.findByOrgSlug(
      input.organizationSlug,
      input.userId,
    );
    if (!organizationMember) return left(new NotAllowedError());

    return right({
      bots: await this.bots.findManyByOrganizationId(
        organizationMember.organizationId,
      ),
    });
  }
}
