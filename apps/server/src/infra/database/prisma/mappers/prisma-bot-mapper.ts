import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Bot } from '@/domain/enterprise/entities/bot';
import type { ChatConfig } from '@/domain/enterprise/entities/chat-config';
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
          avatarUrl: raw.avatarUrl,
          avatarStorageKey: raw.avatarStorageKey,
          inputPlaceholder: raw.inputPlaceholder,
          submitButtonText: raw.submitButtonText,
          showMessageTimestamps: raw.showMessageTimestamps,
          starterQuestions: raw.starterQuestions,
          generateStarterQuestionsAfterResponse:
            raw.generateStarterQuestionsAfterResponse,
          initialMessage: raw.initialMessage,
          headerStatusText: raw.headerStatusText,
          chatBackgroundColor: raw.chatBackgroundColor,
          headerFooterBackgroundColor: raw.headerFooterBackgroundColor,
          footerBackgroundColor: raw.footerBackgroundColor,
          inputBackgroundColor: raw.inputBackgroundColor,
          inputTextColor: raw.inputTextColor,
          starterQuestionsTextColor: raw.starterQuestionsTextColor,
          assistantMessageBackgroundColor: raw.assistantMessageBackgroundColor,
          userMessageBackgroundColor: raw.userMessageBackgroundColor,
          chatWidth: raw.chatWidth,
          chatHeight: raw.chatHeight,
          chatRadius: raw.chatRadius,
          messageRadius: raw.messageRadius,
          chatShadow: raw.chatShadow as ChatConfig['chatShadow'],
          floatingPosition:
            raw.floatingPosition as ChatConfig['floatingPosition'],
          model: raw.model,
          temperature: raw.temperature,
          maxTokens: raw.maxTokens,
          maxMessagesPerDay: raw.maxMessagesPerDay,
          maxUserMessagesPerConversation: raw.maxUserMessagesPerConversation,
        },
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
      avatarUrl: bot.chatConfig.avatarUrl,
      avatarStorageKey: bot.chatConfig.avatarStorageKey,
      inputPlaceholder: bot.chatConfig.inputPlaceholder,
      submitButtonText: bot.chatConfig.submitButtonText,
      showMessageTimestamps: bot.chatConfig.showMessageTimestamps,
      starterQuestions: bot.chatConfig.starterQuestions,
      generateStarterQuestionsAfterResponse:
        bot.chatConfig.generateStarterQuestionsAfterResponse,
      initialMessage: bot.chatConfig.initialMessage,
      headerStatusText: bot.chatConfig.headerStatusText,
      chatBackgroundColor: bot.chatConfig.chatBackgroundColor,
      headerFooterBackgroundColor: bot.chatConfig.headerFooterBackgroundColor,
      footerBackgroundColor: bot.chatConfig.footerBackgroundColor,
      inputBackgroundColor: bot.chatConfig.inputBackgroundColor,
      inputTextColor: bot.chatConfig.inputTextColor,
      starterQuestionsTextColor: bot.chatConfig.starterQuestionsTextColor,
      assistantMessageBackgroundColor:
        bot.chatConfig.assistantMessageBackgroundColor,
      userMessageBackgroundColor: bot.chatConfig.userMessageBackgroundColor,
      chatWidth: bot.chatConfig.chatWidth,
      chatHeight: bot.chatConfig.chatHeight,
      chatRadius: bot.chatConfig.chatRadius,
      messageRadius: bot.chatConfig.messageRadius,
      chatShadow: bot.chatConfig.chatShadow,
      floatingPosition: bot.chatConfig.floatingPosition,
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
      avatarUrl: bot.chatConfig.avatarUrl,
      avatarStorageKey: bot.chatConfig.avatarStorageKey,
      inputPlaceholder: bot.chatConfig.inputPlaceholder,
      submitButtonText: bot.chatConfig.submitButtonText,
      showMessageTimestamps: bot.chatConfig.showMessageTimestamps,
      starterQuestions: bot.chatConfig.starterQuestions,
      generateStarterQuestionsAfterResponse:
        bot.chatConfig.generateStarterQuestionsAfterResponse,
      initialMessage: bot.chatConfig.initialMessage,
      headerStatusText: bot.chatConfig.headerStatusText,
      chatBackgroundColor: bot.chatConfig.chatBackgroundColor,
      headerFooterBackgroundColor: bot.chatConfig.headerFooterBackgroundColor,
      footerBackgroundColor: bot.chatConfig.footerBackgroundColor,
      inputBackgroundColor: bot.chatConfig.inputBackgroundColor,
      inputTextColor: bot.chatConfig.inputTextColor,
      starterQuestionsTextColor: bot.chatConfig.starterQuestionsTextColor,
      assistantMessageBackgroundColor:
        bot.chatConfig.assistantMessageBackgroundColor,
      userMessageBackgroundColor: bot.chatConfig.userMessageBackgroundColor,
      chatWidth: bot.chatConfig.chatWidth,
      chatHeight: bot.chatConfig.chatHeight,
      chatRadius: bot.chatConfig.chatRadius,
      messageRadius: bot.chatConfig.messageRadius,
      chatShadow: bot.chatConfig.chatShadow,
      floatingPosition: bot.chatConfig.floatingPosition,
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
