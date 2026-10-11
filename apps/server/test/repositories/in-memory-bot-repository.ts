import type {
  BotData,
  BotRepository,
  CreateBotInput,
} from '../../src/domain/application/repositories/bot-repository.js';

export class InMemoryBotRepository implements BotRepository {
  public items: BotData[] = [];

  async create(bot: CreateBotInput): Promise<void> {
    this.items.push({ ...bot, documentCount: 0 });
  }

  async findManyByOrganizationId(organizationId: string): Promise<BotData[]> {
    return this.items
      .filter((bot) => bot.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }

  async findBySlugAndOrganizationId(
    slug: string,
    organizationId: string,
  ): Promise<BotData | null> {
    return (
      this.items.find(
        (bot) => bot.slug === slug && bot.organizationId === organizationId,
      ) ?? null
    );
  }

  async deleteIfEmpty(botId: string, organizationId: string): Promise<boolean> {
    const index = this.items.findIndex(
      (bot) => bot.id === botId && bot.organizationId === organizationId,
    );

    if (index < 0 || this.items[index].documentCount > 0) return false;

    this.items.splice(index, 1);
    return true;
  }
}
