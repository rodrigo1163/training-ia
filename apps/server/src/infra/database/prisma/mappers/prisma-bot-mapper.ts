import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Bot } from '@/domain/enterprise/entities/bot';
import type { BotStyle } from '@/domain/enterprise/entities/bot-style';
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
        chatConfig: {
          avatarStorageKey: raw.avatarStorageKey,
          inputPlaceholder: raw.inputPlaceholder,
          submitButtonText: raw.submitButtonText,
          showMessageTimestamps: raw.showMessageTimestamps,
          starterQuestions: raw.starterQuestions,
          generateStarterQuestionsAfterResponse:
            raw.generateStarterQuestionsAfterResponse,
          initialMessage: raw.initialMessage,
          assistantName: raw.assistantName,
          headerStatusText: raw.headerStatusText,
          model: raw.model,
          temperature: raw.temperature,
          maxTokens: raw.maxTokens,
          maxMessagesPerDay: raw.maxMessagesPerDay,
          maxUserMessagesPerConversation: raw.maxUserMessagesPerConversation,
        },
        style: raw.style as unknown as BotStyle,
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
      avatarStorageKey: bot.chatConfig.avatarStorageKey,
      inputPlaceholder: bot.chatConfig.inputPlaceholder,
      submitButtonText: bot.chatConfig.submitButtonText,
      showMessageTimestamps: bot.chatConfig.showMessageTimestamps,
      starterQuestions: bot.chatConfig.starterQuestions,
      generateStarterQuestionsAfterResponse:
        bot.chatConfig.generateStarterQuestionsAfterResponse,
      initialMessage: bot.chatConfig.initialMessage,
      assistantName: bot.chatConfig.assistantName,
      headerStatusText: bot.chatConfig.headerStatusText,
      style: bot.style as unknown as Prisma.InputJsonValue,
      model: bot.chatConfig.model,
      temperature: bot.chatConfig.temperature,
      maxTokens: bot.chatConfig.maxTokens,
      maxMessagesPerDay: bot.chatConfig.maxMessagesPerDay,
      maxUserMessagesPerConversation:
        bot.chatConfig.maxUserMessagesPerConversation,
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
      avatarStorageKey: bot.chatConfig.avatarStorageKey,
      inputPlaceholder: bot.chatConfig.inputPlaceholder,
      submitButtonText: bot.chatConfig.submitButtonText,
      showMessageTimestamps: bot.chatConfig.showMessageTimestamps,
      starterQuestions: bot.chatConfig.starterQuestions,
      generateStarterQuestionsAfterResponse:
        bot.chatConfig.generateStarterQuestionsAfterResponse,
      initialMessage: bot.chatConfig.initialMessage,
      assistantName: bot.chatConfig.assistantName,
      headerStatusText: bot.chatConfig.headerStatusText,
      style: bot.style as unknown as Prisma.InputJsonValue,
      model: bot.chatConfig.model,
      temperature: bot.chatConfig.temperature,
      maxTokens: bot.chatConfig.maxTokens,
      maxMessagesPerDay: bot.chatConfig.maxMessagesPerDay,
      maxUserMessagesPerConversation:
        bot.chatConfig.maxUserMessagesPerConversation,
      updatedAt: bot.updatedAt ?? undefined,
    };
  }
}
