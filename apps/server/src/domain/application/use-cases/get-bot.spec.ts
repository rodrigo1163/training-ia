import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { GetBotUseCase } from './get-bot.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

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
