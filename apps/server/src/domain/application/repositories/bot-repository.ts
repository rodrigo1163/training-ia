import type { Bot } from '../../enterprise/entities/bot.js';

export abstract class BotRepository {
  abstract create(bot: Bot): Promise<void>;
  abstract findManyByOrganizationId(organizationId: string): Promise<Bot[]>;
  abstract findBySlugAndOrganizationId(
    slug: string,
    organizationId: string,
  ): Promise<Bot | null>;
  abstract deleteIfEmpty(bot: Bot): Promise<boolean>;
}
