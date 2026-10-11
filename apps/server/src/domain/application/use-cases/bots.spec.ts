import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { BotNotEmptyError } from '../../../core/errors/errors/bot-not-empty-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { CreateBotUseCase } from './create-bot.js';
import { DeleteBotUseCase } from './delete-bot.js';
import { FetchBotsUseCase } from './fetch-bots.js';
import { GetBotUseCase } from './get-bot.js';

let bots: InMemoryBotRepository;
let organizations: InMemoryOrganizationRepository;

describe('Bot use cases', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizations = new InMemoryOrganizationRepository();
    organizations.items.push(
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    );
  });

  it('creates a bot with a normalized immutable slug', async () => {
    const result = await new CreateBotUseCase(bots, organizations).execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      name: '  Suporte Ágil  ',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0]).toMatchObject({
      organizationId: 'organization-1',
      name: 'Suporte Ágil',
      slug: 'suporte-agil',
      documentCount: 0,
    });
  });

  it('rejects another name that normalizes to the same slug', async () => {
    const create = new CreateBotUseCase(bots, organizations);
    await create.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      name: 'Suporte Ágil',
    });
    const result = await create.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      name: 'suporte agil',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected duplicate bot error');
    expect(result.value).toBeInstanceOf(BotAlreadyExistsError);
  });

  it('lists only bots from the active organization ordered by name', async () => {
    bots.items.push(
      {
        id: '2',
        organizationId: 'organization-1',
        name: 'Zulu',
        slug: 'zulu',
        createdAt: new Date(),
        documentCount: 0,
      },
      {
        id: '1',
        organizationId: 'organization-1',
        name: 'Alpha',
        slug: 'alpha',
        createdAt: new Date(),
        documentCount: 2,
      },
      {
        id: '3',
        organizationId: 'organization-2',
        name: 'Other',
        slug: 'other',
        createdAt: new Date(),
        documentCount: 0,
      },
    );
    const result = await new FetchBotsUseCase(bots, organizations).execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bots.map((bot) => bot.slug)).toEqual(['alpha', 'zulu']);
  });

  it('gets a bot only inside its organization hierarchy', async () => {
    bots.items.push({
      id: '1',
      organizationId: 'organization-2',
      name: 'Bot',
      slug: 'bot',
      createdAt: new Date(),
      documentCount: 0,
    });
    const result = await new GetBotUseCase(bots, organizations).execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('deletes an empty bot, including the default bot', async () => {
    bots.items.push({
      id: 'default',
      organizationId: 'organization-1',
      name: 'Default Bot',
      slug: 'default',
      createdAt: new Date(),
      documentCount: 0,
    });
    const result = await new DeleteBotUseCase(bots, organizations).execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      botSlug: 'default',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items).toHaveLength(0);
  });

  it('blocks deleting a bot that has documents', async () => {
    bots.items.push({
      id: '1',
      organizationId: 'organization-1',
      name: 'Bot',
      slug: 'bot',
      createdAt: new Date(),
      documentCount: 1,
    });
    const result = await new DeleteBotUseCase(bots, organizations).execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected non-empty bot error');
    expect(result.value).toBeInstanceOf(BotNotEmptyError);
  });

  it('rejects an organization different from the active session', async () => {
    const result = await new FetchBotsUseCase(bots, organizations).execute({
      organizationSlug: 'organization-two',
      activeOrganizationId: 'organization-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden error');
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
