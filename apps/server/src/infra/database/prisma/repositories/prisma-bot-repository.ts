import { Injectable } from '@nestjs/common';
import type { BotRepository } from '../../../../domain/application/repositories/bot-repository.js';
import type { Bot } from '../../../../domain/enterprise/entities/bot.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaBotMapper } from '../mappers/prisma-bot-mapper.js';

@Injectable()
export class PrismaBotRepository implements BotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(bot: Bot): Promise<void> {
    const data = PrismaBotMapper.toPrisma(bot);

    await this.prisma.bot.create({ data });
  }

  async findManyByOrgId(orgId: string): Promise<Bot[]> {
    const bots = await this.prisma.bot.findMany({
      where: { organizationId: orgId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { documents: true } } },
    });

    return bots.map(PrismaBotMapper.toDomain);
  }

  async findBySlugAndOrgId(
    slug: string,
    orgId: string,
  ): Promise<Bot | null> {
    const bot = await this.prisma.bot.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
      include: { _count: { select: { documents: true } } },
    });

    return bot ? PrismaBotMapper.toDomain(bot) : null;
  }

  async deleteIfEmpty(bot: Bot): Promise<boolean> {
    const result = await this.prisma.bot.deleteMany({
      where: {
        id: bot.id.toString(),
        organizationId: bot.orgId.toString(),
        documents: { none: {} },
      },
    });

    return result.count === 1;
  }
}
