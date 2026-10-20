import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { BotNotEmptyError } from '@training-ia/core/errors/errors/bot-not-empty-error.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

type Response = Either<
  ResourceNotFoundError | BotNotEmptyError,
  null
>;

@Injectable()
export class DeleteBotUseCase {
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

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const deleted = await this.bots.deleteIfEmpty(bot);

    if (!deleted) {
      return left(new BotNotEmptyError());
    }

    return right(null);
  }
}
