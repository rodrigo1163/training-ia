import type { Bot } from '@/domain/enterprise/entities/bot';

export class BotPresenter {
  static toHTTP(bot: Bot) {
    return {
      id: bot.id.toString(),
      name: bot.name,
      description: bot.description,
      personality: bot.personality,
      language: bot.language,
      systemMessage: bot.systemMessage,
      slug: bot.slug.value,
      documentCount: bot.documentCount,
      createdAt: bot.createdAt.toISOString(),
    };
  }
}
