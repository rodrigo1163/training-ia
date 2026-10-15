import { Injectable } from '@nestjs/common';
import type { BotDeploymentRepository } from '@/domain/application/repositories/bot-deployment-repository';
import type { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaBotDeploymentMapper } from '@/infra/database/prisma/mappers/prisma-bot-deployment-mapper';

@Injectable()
export class PrismaBotDeploymentRepository implements BotDeploymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBotId(botId: string): Promise<BotDeployment | null> {
    const deployment = await this.prisma.botDeployment.findUnique({ where: { botId } });
    return deployment ? PrismaBotDeploymentMapper.toDomain(deployment) : null;
  }

  async findByPublicKey(publicKey: string): Promise<BotDeployment | null> {
    const deployment = await this.prisma.botDeployment.findUnique({ where: { publicKey } });
    return deployment ? PrismaBotDeploymentMapper.toDomain(deployment) : null;
  }

  async create(deployment: BotDeployment): Promise<void> {
    await this.prisma.botDeployment.create({ data: PrismaBotDeploymentMapper.toPrisma(deployment) });
  }

  async update(deployment: BotDeployment): Promise<void> {
    await this.prisma.botDeployment.update({
      where: { id: deployment.id.toString() },
      data: {
        status: deployment.status,
        allowedOrigins: deployment.allowedOrigins,
        updatedAt: deployment.updatedAt ?? undefined,
      },
    });
  }
}
