import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { FetchBotsUseCase } from './fetch-bots';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;

describe('Fetch bots', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
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
    const result = await new FetchBotsUseCase(bots).execute({
      organizationMember,
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bots.map((bot) => bot.slug.value)).toEqual([
      'alpha',
      'zulu',
    ]);
  });

});
