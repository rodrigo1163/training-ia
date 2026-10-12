import type { BotRepository } from '../../src/domain/application/repositories/bot-repository.js';
import type { Bot } from '../../src/domain/enterprise/entities/bot.js';

export class InMemoryBotRepository implements BotRepository {
  public items: Bot[] = [];

  async create(bot: Bot): Promise<void> {
    this.items.push(bot);
  }

  async findManyByOrganizationId(organizationId: string): Promise<Bot[]> {
    return this.items
      .filter((bot) => bot.organizationId.toString() === organizationId)
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.id.toString().localeCompare(b.id.toString()),
      );
  }

  async findBySlugAndOrganizationId(
    slug: string,
    organizationId: string,
  ): Promise<Bot | null> {
    return (
      this.items.find(
        (bot) =>
          bot.slug.value === slug &&
          bot.organizationId.toString() === organizationId,
      ) ?? null
    );
  }

  async deleteIfEmpty(bot: Bot): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id.equals(bot.id));

    if (index < 0 || this.items[index].documentCount > 0) return false;

    this.items.splice(index, 1);
    return true;
  }
}
