import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import type {
  BotDeployment,
  BotDeploymentStatus,
} from '../../enterprise/entities/bot-deployment.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';

interface EditBotDeploymentUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  allowedOrigins?: string[];
  status?: BotDeploymentStatus;
}

type EditBotDeploymentUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    deployment: BotDeployment;
  }
>;

@Injectable()
export class EditBotDeploymentUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly deployments: BotDeploymentRepository,
  ) {}

  async execute({
    organizationMember,
    botSlug,
    allowedOrigins,
    status,
  }: EditBotDeploymentUseCaseRequest): Promise<EditBotDeploymentUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) return left(new ResourceNotFoundError());

    const deployment = await this.deployments.findByBotId(bot.id.toString());

    if (!deployment) return left(new ResourceNotFoundError());

    if (allowedOrigins) {
      deployment.allowedOrigins = allowedOrigins;
    }

    if (status) {
      deployment.status = status;
    }

    await this.deployments.update(deployment);

    return right({ deployment });
  }
}
