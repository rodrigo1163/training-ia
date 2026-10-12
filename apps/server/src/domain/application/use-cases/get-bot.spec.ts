import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { GetBotUseCase } from './get-bot.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let bots: InMemoryBotRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;

describe('Get bot', () => {
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
    const result = await new GetBotUseCase(bots, organizationMembers).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
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

    const result = await new GetBotUseCase(bots, organizationMembers).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      botSlug: 'support-bot',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bot).toBe(bot);
  });

  it('rejects a user who is not a member of the organization', async () => {
    const result = await new GetBotUseCase(bots, organizationMembers).execute({
      orgSlug: 'organization-one',
      userId: 'user-2',
      botSlug: 'support-bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden error');
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
