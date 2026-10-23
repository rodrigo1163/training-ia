import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Bot } from '@/domain/enterprise/entities/bot';
import { Slug } from '@/domain/enterprise/value-objects/slug';
import type {
  Bot as PrismaBot,
  Prisma,
} from '../../../../../prisma/generated/prisma/client';

type PrismaBotWithDocumentCount = PrismaBot & {
  _count: {
    documents: number;
  };
};

export class PrismaBotMapper {
  static toDomain(raw: PrismaBotWithDocumentCount): Bot {
    return Bot.create(
      {
        orgId: new UniqueEntityId(raw.organizationId),
        name: raw.name,
        description: raw.description,
        personality: raw.personality,
        language: raw.language,
        systemMessage: raw.systemMessage,
        slug: Slug.create(raw.slug),
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
      organizationId: bot.orgId.toString(),
      name: bot.name,
      description: bot.description,
      personality: bot.personality,
      language: bot.language,
      systemMessage: bot.systemMessage,
      slug: bot.slug.value,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt ?? undefined,
    };
  }

  static toPrismaUpdate(bot: Bot): Prisma.BotUncheckedUpdateInput {
    return {
      name: bot.name,
      description: bot.description,
      personality: bot.personality,
      language: bot.language,
      systemMessage: bot.systemMessage,
      updatedAt: bot.updatedAt ?? undefined,
    };
  }
}
