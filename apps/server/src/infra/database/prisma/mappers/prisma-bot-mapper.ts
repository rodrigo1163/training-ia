import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Bot } from '@/domain/enterprise/entities/bot';
import { BotSlug } from '@/domain/enterprise/value-objects/bot-slug';
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
  static toDomain(raw: PrismaBotWithDocumentCount): Bot {
    return Bot.create(
      {
        organizationId: new UniqueEntityId(raw.organizationId),
        name: raw.name,
        slug: BotSlug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        documentCount: raw._count.documents,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(bot: Bot): Prisma.BotUncheckedCreateInput {
    return {
      id: bot.id.toString(),
      organizationId: bot.organizationId.toString(),
      name: bot.name,
      slug: bot.slug.value,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt ?? undefined,
    };
  }
}
