import type { BotData } from '@/domain/application/repositories/bot-repository';

export class BotPresenter {
  static toHTTP(bot: BotData) {
    return {
      id: bot.id,
      name: bot.name,
      slug: bot.slug,
      documentCount: bot.documentCount,
      createdAt: bot.createdAt.toISOString(),
    };
  }
}
