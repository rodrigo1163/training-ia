import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Bot } from './bot.js';

describe('Bot', () => {
  it('creates a bot with domain defaults', () => {
    const bot = Bot.create({
      organizationId: new UniqueEntityId('organization-1'),
      name: '  Suporte Ágil  ',
    });

    expect(bot.id).toBeInstanceOf(UniqueEntityId);
    expect(bot.organizationId.toString()).toBe('organization-1');
    expect(bot.slug.value).toBe('suporte-agil');
    expect(bot.documentCount).toBe(0);
    expect(bot.createdAt).toBeInstanceOf(Date);
    expect(bot.updatedAt).toBeNull();
  });

  it('preserves a provided identity and state', () => {
    const id = new UniqueEntityId('bot-1');
    const createdAt = new Date('2026-10-10T12:00:00.000Z');
    const updatedAt = new Date('2026-10-11T12:00:00.000Z');
    const bot = Bot.create(
      {
        organizationId: new UniqueEntityId('organization-1'),
        name: 'Support Bot',
        documentCount: 3,
        createdAt,
        updatedAt,
      },
      id,
    );

    expect(bot.id).toEqual(id);
    expect(bot.documentCount).toBe(3);
    expect(bot.createdAt).toEqual(createdAt);
    expect(bot.updatedAt).toEqual(updatedAt);
  });
});
