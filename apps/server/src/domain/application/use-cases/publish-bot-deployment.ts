import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';
import { DeploymentAlreadyExistsError } from './errors/deployment-already-exists-error.js';

@Injectable()
export class PublishBotDeploymentUseCase {
  constructor(private readonly bots: BotRepository, private readonly deployments: BotDeploymentRepository) {}

  async execute(input: { organizationMember: OrganizationMember; botSlug: string; allowedOrigins: string[] }): Promise<Either<ResourceNotFoundError | DeploymentAlreadyExistsError, { deployment: BotDeployment }>> {
    const bot = await this.bots.findBySlugAndOrgId(input.botSlug, input.organizationMember.orgId.toString());
    if (!bot) return left(new ResourceNotFoundError());
    if (await this.deployments.findByBotId(bot.id.toString())) return left(new DeploymentAlreadyExistsError());

    const deployment = BotDeployment.create({
      botId: bot.id,
      publicKey: `dep_${randomBytes(24).toString('base64url')}`,
      allowedOrigins: input.allowedOrigins,
    });
    await this.deployments.create(deployment);
    return right({ deployment });
  }
}
