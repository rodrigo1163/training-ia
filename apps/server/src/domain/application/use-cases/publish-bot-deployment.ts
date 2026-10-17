import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';
import { DeploymentAlreadyExistsError } from './errors/deployment-already-exists-error.js';

interface PublishBotDeploymentUseCaseRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  allowedOrigins: string[];
}

type PublishBotDeploymentUseCaseResponse = Either<
  ResourceNotFoundError | DeploymentAlreadyExistsError,
  {
    deployment: BotDeployment;
  }
>;

@Injectable()
export class PublishBotDeploymentUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly deployments: BotDeploymentRepository,
  ) {}

  async execute({
    organizationMember,
    botSlug,
    allowedOrigins,
  }: PublishBotDeploymentUseCaseRequest): Promise<PublishBotDeploymentUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const existingDeployment = await this.deployments.findByBotId(
      bot.id.toString(),
    );

    if (existingDeployment) {
      return left(new DeploymentAlreadyExistsError());
    }

    const deployment = BotDeployment.create({
      botId: bot.id,
      publicKey: `dep_${randomBytes(24).toString('base64url')}`,
      allowedOrigins,
    });

    await this.deployments.create(deployment);

    return right({ deployment });
  }
}
