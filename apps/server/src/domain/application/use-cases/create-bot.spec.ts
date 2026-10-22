import { BotAlreadyExistsError } from './errors/bot-already-exists-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { CreateBotUseCase } from './create-bot.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;

describe('Create bot', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
  });

  it('creates a bot with a normalized immutable slug', async () => {
    const result = await new CreateBotUseCase(bots).execute({
      organizationMember,
      name: '  Suporte agil  ',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0].orgId.toString()).toBe('organization-1');
    expect(bots.items[0].name).toBe('Suporte agil');
    expect(bots.items[0].slug.value).toBe('suporte-agil');
    expect(bots.items[0].documentCount).toBe(0);
  });

  it('creates a bot with its AI configuration', async () => {
    const result = await new CreateBotUseCase(bots).execute({
      organizationMember,
      name: 'Support Bot',
      description: 'Ajuda clientes.',
      personality: 'PROFESSIONAL',
      language: 'pt-BR',
      systemMessage: 'Responda de forma clara.',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0]?.description).toBe('Ajuda clientes.');
    expect(bots.items[0]?.personality).toBe('PROFESSIONAL');
    expect(bots.items[0]?.language).toBe('pt-BR');
    expect(bots.items[0]?.systemMessage).toBe('Responda de forma clara.');
  });

  it('rejects another name that normalizes to the same slug', async () => {
    const create = new CreateBotUseCase(bots);
    await create.execute({
      organizationMember,
      name: 'Suporte agil',
    });
    const result = await create.execute({
      organizationMember,
      name: 'Suporte agil',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected duplicate bot error');
    expect(result.value).toBeInstanceOf(BotAlreadyExistsError);
  });
});
