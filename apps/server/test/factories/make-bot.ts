import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../src/core/entities/unique-entity-id.js';
import {
  Bot,
  type BotProps,
} from '../../src/domain/enterprise/entities/bot.js';
import { PrismaBotMapper } from '../../src/infra/database/prisma/mappers/prisma-bot-mapper.js';
import { PrismaService } from '../../src/infra/database/prisma/prisma.service.js';

export function makeBot(override: Partial<BotProps> = {}, id?: UniqueEntityId) {
  const suffix = randomUUID();

  return Bot.create(
    {
      orgId: new UniqueEntityId(),
      name: `Bot ${suffix}`,
      ...override,
    },
    id,
  );
}

@Injectable()
export class BotFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaBot(
    data: Partial<BotProps> = {},
    id?: UniqueEntityId,
  ): Promise<Bot> {
    const bot = makeBot(data, id);

    await this.prisma.bot.create({
      data: PrismaBotMapper.toPrisma(bot),
    });

    return bot;
  }
}
