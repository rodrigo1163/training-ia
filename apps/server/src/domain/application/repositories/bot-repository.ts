export interface CreateBotInput {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface BotData extends CreateBotInput {
  documentCount: number;
}

export abstract class BotRepository {
  abstract create(bot: CreateBotInput): Promise<void>;
  abstract findManyByOrganizationId(organizationId: string): Promise<BotData[]>;
  abstract findBySlugAndOrganizationId(
    slug: string,
    organizationId: string,
  ): Promise<BotData | null>;
  abstract deleteIfEmpty(
    botId: string,
    organizationId: string,
  ): Promise<boolean>;
}
