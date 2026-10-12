import { BotNotEmptyError } from '../../../core/errors/errors/bot-not-empty-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { DeleteBotUseCase } from './delete-bot.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let bots: InMemoryBotRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;

describe('Delete bot', () => {
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

  it('deletes an empty bot, including the default bot', async () => {
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Default',
        },
        new UniqueEntityId('default'),
      ),
    );
    const result = await new DeleteBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      botSlug: 'default',
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items).toHaveLength(0);
  });

  it('blocks deleting a bot that has documents', async () => {
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Bot',
          documentCount: 1,
        },
        new UniqueEntityId('1'),
      ),
    );
    const result = await new DeleteBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected non-empty bot error');
    expect(result.value).toBeInstanceOf(BotNotEmptyError);
  });

  it('rejects a user who is not a member of the organization', async () => {
    const result = await new DeleteBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-2',
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden error');
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(bots.items).toHaveLength(0);
  });

  it('rejects an unknown bot', async () => {
    const result = await new DeleteBotUseCase(
      bots,
      organizationMembers,
    ).execute({
      orgSlug: 'organization-one',
      userId: 'user-1',
      botSlug: 'missing-bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
