import type { Bot } from '../../enterprise/entities/bot.js';

export abstract class BotRepository {
  abstract create(bot: Bot): Promise<void>;
  abstract findManyByOrgId(orgId: string): Promise<Bot[]>;
  abstract findBySlugAndOrgId(
    slug: string,
    orgId: string,
  ): Promise<Bot | null>;
  abstract deleteIfEmpty(bot: Bot): Promise<boolean>;
}
