import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { BotDeployment } from '../../enterprise/entities/bot-deployment';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { BotRepository } from '../repositories/bot-repository';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { DeploymentAlreadyExistsError } from './errors/deployment-already-exists-error';

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
  ) { }

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
