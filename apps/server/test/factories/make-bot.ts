import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Bot,
  type BotProps,
} from '../../src/domain/enterprise/entities/bot';
import { PrismaBotMapper } from '../../src/infra/database/prisma/mappers/prisma-bot-mapper';
import { PrismaService } from '../../src/infra/database/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) { }

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
