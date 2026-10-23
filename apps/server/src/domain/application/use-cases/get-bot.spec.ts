import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { GetBotUseCase } from './get-bot';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;

describe('Get bot', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
  });

  it('gets a bot only inside its organization hierarchy', async () => {
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-2'),
          name: 'Bot',
        },
        new UniqueEntityId('1'),
      ),
    );
    const result = await new GetBotUseCase(bots).execute({
      organizationMember,
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('returns a bot from the member organization', async () => {
    const bot = makeBot(
      {
        orgId: new UniqueEntityId('organization-1'),
        name: 'Support Bot',
      },
      new UniqueEntityId('bot-1'),
    );
    bots.items.push(bot);

    const result = await new GetBotUseCase(bots).execute({
      organizationMember,
      botSlug: 'support-bot',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bot).toBe(bot);
  });

});
