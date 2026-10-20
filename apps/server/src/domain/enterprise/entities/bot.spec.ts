import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { Bot } from './bot.js';

describe('Bot', () => {
  it('creates a bot with domain defaults', () => {
    const bot = Bot.create({
      orgId: new UniqueEntityId('organization-1'),
      name: '  Suporte agil  ',
    });

    expect(bot.id).toBeInstanceOf(UniqueEntityId);
    expect(bot.orgId.toString()).toBe('organization-1');
    expect(bot.slug.value).toBe('suporte-agil');
    expect(bot.documentCount).toBe(0);
    expect(bot.description).toBeNull();
    expect(bot.personality).toBe('NEUTRAL');
    expect(bot.language).toBe('pt-BR');
    expect(bot.systemMessage).toBeNull();
    expect(bot.createdAt).toBeInstanceOf(Date);
    expect(bot.updatedAt).toBeNull();
  });

  it('preserves a provided identity and state', () => {
    const id = new UniqueEntityId('bot-1');
    const createdAt = new Date('2026-10-10T12:00:00.000Z');
    const updatedAt = new Date('2026-10-11T12:00:00.000Z');
    const bot = Bot.create(
      {
        orgId: new UniqueEntityId('organization-1'),
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

  it('creates a bot with the complete AI configuration', () => {
    const bot = Bot.create({
      orgId: new UniqueEntityId('organization-1'),
      name: 'Support Bot Updated',
      description: 'Ajuda clientes com dÃºvidas sobre suporte.',
      personality: 'FRIENDLY',
      language: 'pt-BR',
      systemMessage: 'Responda com clareza e objetividade.',
    });

    expect(bot.name).toBe('Support Bot Updated');
    expect(bot.description).toBe('Ajuda clientes com dÃºvidas sobre suporte.');
    expect(bot.personality).toBe('FRIENDLY');
    expect(bot.language).toBe('pt-BR');
    expect(bot.systemMessage).toBe('Responda com clareza e objetividade.');
  });

});
