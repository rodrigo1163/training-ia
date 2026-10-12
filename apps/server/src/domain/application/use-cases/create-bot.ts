import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import { Bot } from '../../enterprise/entities/bot.js';

interface CreateBotRequest {
  organizationSlug: string;
  userId: string;
  name: string;
}

type CreateBotResponse = Either<
  NotAllowedError | BotAlreadyExistsError,
  { bot: Bot }
>;

@Injectable()
export class CreateBotUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async execute(request: CreateBotRequest): Promise<CreateBotResponse> {
    const organizationMember = await this.organizationMembers.findByOrgSlug(
      request.organizationSlug,
      request.userId,
    );

    if (!organizationMember) return left(new NotAllowedError());

    const bot = Bot.create({
      organizationId: organizationMember.organizationId,
      name: request.name.trim(),
    });

    const existingBot = await this.bots.findBySlugAndOrganizationId(
      bot.slug.value,
      organizationMember.organizationId.toString(),
    );

    if (existingBot) return left(new BotAlreadyExistsError());

    await this.bots.create(bot);

    return right({ bot });
  }
}
