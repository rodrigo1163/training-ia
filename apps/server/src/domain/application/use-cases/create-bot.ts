import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Bot } from '../../enterprise/entities/bot.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

interface CreateBotRequest {
  organizationMember: OrganizationMember;
  name: string;
}

type CreateBotResponse = Either<
  BotAlreadyExistsError,
  { bot: Bot }
>;

@Injectable()
export class CreateBotUseCase {
  constructor(
    private readonly bots: BotRepository,
  ) {}

  async execute(request: CreateBotRequest): Promise<CreateBotResponse> {
    const bot = Bot.create({
      orgId: request.organizationMember.orgId,
      name: request.name.trim(),
    });

    const existingBot = await this.bots.findBySlugAndOrgId(
      bot.slug.value,
      request.organizationMember.orgId.toString(),
    );

    if (existingBot) {
      return left(new BotAlreadyExistsError());
    }

    await this.bots.create(bot);

    return right({ bot });
  }
}
