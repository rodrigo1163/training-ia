import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import type { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';
import { BotRepository } from '../repositories/bot-repository.js';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';

@Injectable()
export class GetBotDeploymentUseCase {
  constructor(private readonly bots: BotRepository, private readonly deployments: BotDeploymentRepository) {}

  async execute(input: { organizationMember: OrganizationMember; botSlug: string }): Promise<Either<ResourceNotFoundError, { deployment: BotDeployment | null }>> {
    const bot = await this.bots.findBySlugAndOrgId(input.botSlug, input.organizationMember.orgId.toString());
    if (!bot) return left(new ResourceNotFoundError());
    return right({ deployment: await this.deployments.findByBotId(bot.id.toString()) });
  }
}
