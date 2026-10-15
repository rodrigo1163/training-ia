import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import type { BotDeployment, BotDeploymentStatus } from '@/domain/enterprise/entities/bot-deployment';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';

@Injectable()
export class EditBotDeploymentUseCase {
  constructor(private readonly bots: BotRepository, private readonly deployments: BotDeploymentRepository) {}

  async execute(input: { organizationMember: OrganizationMember; botSlug: string; allowedOrigins?: string[]; status?: BotDeploymentStatus }): Promise<Either<ResourceNotFoundError, { deployment: BotDeployment }>> {
    const bot = await this.bots.findBySlugAndOrgId(input.botSlug, input.organizationMember.orgId.toString());
    if (!bot) return left(new ResourceNotFoundError());
    const deployment = await this.deployments.findByBotId(bot.id.toString());
    if (!deployment) return left(new ResourceNotFoundError());

    if (input.allowedOrigins) deployment.allowedOrigins = input.allowedOrigins;
    if (input.status) deployment.status = input.status;
    await this.deployments.update(deployment);
    return right({ deployment });
  }
}
