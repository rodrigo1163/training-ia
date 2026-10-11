import type {
  BotData,
  CreateBotInput,
} from '../../../../domain/application/repositories/bot-repository.js';
import type {
  Bot as PrismaBot,
  Prisma,
} from '../../../../../prisma/generated/prisma/client.js';

type PrismaBotWithDocumentCount = PrismaBot & {
  _count: {
    documents: number;
  };
};

export class PrismaBotMapper {
  static toDomain(bot: PrismaBotWithDocumentCount): BotData {
    return {
      id: bot.id,
      organizationId: bot.organizationId,
      name: bot.name,
      slug: bot.slug,
      createdAt: bot.createdAt,
      documentCount: bot._count.documents,
    };
  }

  static toPrisma(bot: CreateBotInput): Prisma.BotUncheckedCreateInput {
    return {
      id: bot.id,
      organizationId: bot.organizationId,
      name: bot.name,
      slug: bot.slug,
      createdAt: bot.createdAt,
    };
  }
}
