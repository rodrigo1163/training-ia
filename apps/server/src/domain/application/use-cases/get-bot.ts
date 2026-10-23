import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { BotRepository } from '../repositories/bot-repository';
import type { Bot } from '../../enterprise/entities/bot';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

type Response = Either<ResourceNotFoundError, { bot: Bot }>;

@Injectable()
export class GetBotUseCase {
  constructor(
    private readonly bots: BotRepository,
  ) { }

  async execute(input: {
    organizationMember: OrganizationMember;
    botSlug: string;
  }): Promise<Response> {
    const bot = await this.bots.findBySlugAndOrgId(
      input.botSlug,
      input.organizationMember.orgId.toString(),
    );
    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    return right({ bot });
  }
}
