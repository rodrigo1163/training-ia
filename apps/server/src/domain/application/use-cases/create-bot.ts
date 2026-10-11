import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotData, BotRepository } from '../repositories/bot-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';
import { BotSlug } from '../../enterprise/value-objects/bot-slug.js';

interface CreateBotRequest {
  organizationSlug: string;
  activeOrganizationId: string;
  name: string;
}

type CreateBotResponse = Either<
  ResourceNotFoundError | NotAllowedError | BotAlreadyExistsError,
  { bot: BotData }
>;

@Injectable()
export class CreateBotUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(request: CreateBotRequest): Promise<CreateBotResponse> {
    const organization = await this.organizations.findBySlug(
      request.organizationSlug,
    );
    if (!organization) return left(new ResourceNotFoundError());
    if (organization.id !== request.activeOrganizationId) {
      return left(new NotAllowedError());
    }

    const name = request.name.trim();
    const slug = BotSlug.create(name).value;
    const existingBot = await this.bots.findBySlugAndOrganizationId(
      slug,
      organization.id,
    );

    if (existingBot) return left(new BotAlreadyExistsError());

    const createdAt = new Date();
    const bot: BotData = {
      id: randomUUID(),
      organizationId: organization.id,
      name,
      slug,
      createdAt,
      documentCount: 0,
    };
    await this.bots.create(bot);

    return right({ bot });
  }
}
