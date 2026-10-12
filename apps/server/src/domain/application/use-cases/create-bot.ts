import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { BotData, BotRepository } from '../repositories/bot-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import { BotSlug } from '../../enterprise/value-objects/bot-slug.js';

interface CreateBotRequest {
  organizationSlug: string;
  userId: string;
  name: string;
}

type CreateBotResponse = Either<
  NotAllowedError | BotAlreadyExistsError,
  { bot: BotData }
>;

@Injectable()
export class CreateBotUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
  ) { }

  async execute(request: CreateBotRequest): Promise<CreateBotResponse> {
    const organizationMember = await this.organizationMembers.findByOrgSlug(
      request.organizationSlug,
      request.userId,
    );

    if (!organizationMember) return left(new NotAllowedError());

    const name = request.name.trim();

    const slug = BotSlug.create(name).value;

    const existingBot = await this.bots.findBySlugAndOrganizationId(
      slug,
      organizationMember.organizationId,
    );

    if (existingBot) return left(new BotAlreadyExistsError());

    const createdAt = new Date();
    const bot: BotData = {
      id: randomUUID(),
      organizationId: organizationMember.organizationId,
      name,
      slug,
      createdAt,
      documentCount: 0,
    };
    await this.bots.create(bot);

    return right({ bot });
  }
}
