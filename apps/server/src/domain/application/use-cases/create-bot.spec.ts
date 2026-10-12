import { BotAlreadyExistsError } from '../../../core/errors/errors/bot-already-exists-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { CreateBotUseCase } from './create-bot.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let bots: InMemoryBotRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;

describe('Create bot', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizationMembers = new InMemoryOrganizationMemberRepository();
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-1'),
        userId: new UniqueEntityId('user-1'),
        role: 'owner',
      }),
      'organization-one',
    );
  });

  it('creates a bot with a normalized immutable slug', async () => {
    const result = await new CreateBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      name: '  Suporte Ágil  ',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0].orgId.toString()).toBe('organization-1');
    expect(bots.items[0].name).toBe('Suporte Ágil');
    expect(bots.items[0].slug.value).toBe('suporte-agil');
    expect(bots.items[0].documentCount).toBe(0);
  });

  it('rejects another name that normalizes to the same slug', async () => {
    const create = new CreateBotUseCase(bots, organizationMembers);
    await create.execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      name: 'Suporte Ágil',
    });
    const result = await create.execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      name: 'suporte agil',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected duplicate bot error');
    expect(result.value).toBeInstanceOf(BotAlreadyExistsError);
  });

  it('rejects a user who is not a member of the organization', async () => {
    const result = await new CreateBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-2',
      name: 'Support Bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden error');
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(bots.items).toHaveLength(0);
  });
});
