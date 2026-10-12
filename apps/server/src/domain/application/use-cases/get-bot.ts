import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotData, BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';

type Response = Either<
  ResourceNotFoundError | NotAllowedError,
  { bot: BotData }
>;

@Injectable()
export class GetBotUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async execute(input: {
    organizationSlug: string;
    userId: string;
    botSlug: string;
  }): Promise<Response> {
    const organizationMember = await this.organizationMembers.findByOrgSlug(
      input.organizationSlug,
      input.userId,
    );
    if (!organizationMember) return left(new NotAllowedError());
    const bot = await this.bots.findBySlugAndOrganizationId(
      input.botSlug,
      organizationMember.organizationId,
    );
    if (!bot) return left(new ResourceNotFoundError());

    return right({ bot });
  }
}
