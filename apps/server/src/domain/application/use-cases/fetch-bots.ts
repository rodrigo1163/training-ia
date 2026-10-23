import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { BotRepository } from '../repositories/bot-repository';
import type { Bot } from '../../enterprise/entities/bot';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

type Response = Either<never, { bots: Bot[] }>;

@Injectable()
export class FetchBotsUseCase {
  constructor(
    private readonly bots: BotRepository,
  ) { }

  async execute(input: {
    organizationMember: OrganizationMember;
  }): Promise<Response> {
    return right({
      bots: await this.bots.findManyByOrgId(
        input.organizationMember.orgId.toString(),
      ),
    });
  }
}
