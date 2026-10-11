import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotData, BotRepository } from '../repositories/bot-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';

type Response = Either<
  ResourceNotFoundError | NotAllowedError,
  { bots: BotData[] }
>;

@Injectable()
export class FetchBotsUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(input: {
    organizationSlug: string;
    activeOrganizationId: string;
  }): Promise<Response> {
    const organization = await this.organizations.findBySlug(
      input.organizationSlug,
    );
    if (!organization) return left(new ResourceNotFoundError());
    if (organization.id !== input.activeOrganizationId) {
      return left(new NotAllowedError());
    }

    return right({
      bots: await this.bots.findManyByOrganizationId(organization.id),
    });
  }
}
