import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import type { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';

interface GetBotDeploymentUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
}

type GetBotDeploymentUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    deployment: BotDeployment | null;
  }
>;

@Injectable()
export class GetBotDeploymentUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly deployments: BotDeploymentRepository,
  ) {}

  async execute({
    organizationMember,
    botSlug,
  }: GetBotDeploymentUseCaseRequest): Promise<GetBotDeploymentUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) return left(new ResourceNotFoundError());

    const deployment = await this.deployments.findByBotId(bot.id.toString());

    return right({ deployment });
  }
}
