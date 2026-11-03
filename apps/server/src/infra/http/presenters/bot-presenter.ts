import type { Bot } from '@/domain/enterprise/entities/bot';
import { PublicChatConfigPresenter } from './public-chat-config-presenter';

export class BotPresenter {
  static toHTTP(bot: Bot) {
    const { style, ...chatConfig } = PublicChatConfigPresenter.toHTTP(
      bot.chatConfig,
      bot.style,
    );

    return {
      id: bot.id.toString(),
      name: bot.name,
      description: bot.description,
      personality: bot.personality,
      language: bot.language,
      systemMessage: bot.systemMessage,
      chatConfig: {
        ...chatConfig,
        model: bot.chatConfig.model,
        temperature: bot.chatConfig.temperature,
        maxTokens: bot.chatConfig.maxTokens,
        maxMessagesPerDay: bot.chatConfig.maxMessagesPerDay,
        maxUserMessagesPerConversation:
          bot.chatConfig.maxUserMessagesPerConversation,
      },
      style,
      slug: bot.slug.value,
      documentCount: bot.documentCount,
      createdAt: bot.createdAt.toISOString(),
    };
  }
}
