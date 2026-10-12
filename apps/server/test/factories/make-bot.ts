import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Bot, Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../../src/infra/database/prisma/prisma.service.js';

type MakeBotInput = Pick<Prisma.BotUncheckedCreateInput, 'organizationId'> &
  Partial<Omit<Prisma.BotUncheckedCreateInput, 'organizationId'>>;

@Injectable()
export class BotFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaBot(data: MakeBotInput): Promise<Bot> {
    const suffix = randomUUID();

    return this.prisma.bot.create({
      data: {
        id: data.id ?? `bot-${suffix}`,
        organizationId: data.organizationId,
        name: data.name ?? `Bot ${suffix}`,
        slug: data.slug ?? `bot-${suffix}`,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }
}
