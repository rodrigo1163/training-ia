import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { EditBotUseCase } from './edit-bot.js';

let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;
let sut: EditBotUseCase;

describe('Edit bot', () => {
  beforeEach(async () => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    await bots.create(
      makeBot(
        { orgId: new UniqueEntityId('organization-1'), name: 'Support Bot' },
        new UniqueEntityId('bot-1'),
      ),
    );
    sut = new EditBotUseCase(bots);
  });

  it('saves the bot name and AI configuration', async () => {
    const originalBot = bots.items[0];

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      name: 'Support Bot Updated',
      description: 'Ajuda clientes.',
      personality: 'FRIENDLY',
      language: 'pt-BR',
      systemMessage: 'Responda com clareza.',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bot).not.toBe(originalBot);
    expect(result.value.bot.id).toEqual(originalBot?.id);
    expect(result.value.bot.slug).toEqual(originalBot?.slug);
    expect(result.value.bot.createdAt).toEqual(originalBot?.createdAt);
    expect(bots.items[0]?.name).toBe('Support Bot Updated');
    expect(bots.items[0]?.description).toBe('Ajuda clientes.');
    expect(bots.items[0]?.personality).toBe('FRIENDLY');
    expect(bots.items[0]?.language).toBe('pt-BR');
    expect(bots.items[0]?.systemMessage).toBe('Responda com clareza.');
    expect(bots.items[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      name: 'Missing Bot',
      description: null,
      personality: 'NEUTRAL',
      language: 'pt-BR',
      systemMessage: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
