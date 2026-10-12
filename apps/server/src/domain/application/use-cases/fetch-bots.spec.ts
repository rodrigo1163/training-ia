import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { FetchBotsUseCase } from './fetch-bots.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let bots: InMemoryBotRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;

describe('Fetch bots', () => {
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
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-2'),
        userId: new UniqueEntityId('user-2'),
        role: 'owner',
      }),
      'organization-two',
    );
  });

  it('lists only bots from the member organization ordered by name', async () => {
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Zulu',
        },
        new UniqueEntityId('2'),
      ),
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Alpha',
          documentCount: 2,
        },
        new UniqueEntityId('1'),
      ),
      makeBot(
        {
          orgId: new UniqueEntityId('organization-2'),
          name: 'Other',
        },
        new UniqueEntityId('3'),
      ),
    );
    const result = await new FetchBotsUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bots.map((bot) => bot.slug.value)).toEqual([
      'alpha',
      'zulu',
    ]);
  });

  it('rejects an organization the user is not a member of', async () => {
    const result = await new FetchBotsUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-two',
      userId: 'user-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden error');
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
