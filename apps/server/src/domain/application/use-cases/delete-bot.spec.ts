import { BotNotEmptyError } from './errors/bot-not-empty-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { DeleteBotUseCase } from './delete-bot';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;

describe('Delete bot', () => {
  beforeEach(() => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
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
    const result = await new DeleteBotUseCase(bots).execute({
      organizationMember,
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
    const result = await new DeleteBotUseCase(bots).execute({
      organizationMember,
      botSlug: 'bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected non-empty bot error');
    expect(result.value).toBeInstanceOf(BotNotEmptyError);
  });

  it('rejects an unknown bot', async () => {
    const result = await new DeleteBotUseCase(bots).execute({
      organizationMember,
      botSlug: 'missing-bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
