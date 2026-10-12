import type { Bot } from '@/domain/enterprise/entities/bot';

export class BotPresenter {
  static toHTTP(bot: Bot) {
    return {
      id: bot.id.toString(),
      name: bot.name,
      slug: bot.slug.value,
      documentCount: bot.documentCount,
      createdAt: bot.createdAt.toISOString(),
    };
  }
}
