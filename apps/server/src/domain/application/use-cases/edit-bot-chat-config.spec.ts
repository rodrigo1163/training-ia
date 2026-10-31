import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { EditBotChatConfigUseCase } from './edit-bot-chat-config';

describe('Edit bot chat config', () => {
  let bots: InMemoryBotRepository;
  let organizationMember: OrganizationMember;
  let sut: EditBotChatConfigUseCase;

  beforeEach(async () => {
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });

    await bots.create(
      makeBot(
        {
          orgId: organizationMember.orgId,
          name: 'Support Bot',
        },
        new UniqueEntityId('bot-1'),
      ),
    );
    sut = new EditBotChatConfigUseCase(bots);
  });

  it('applies a partial update and normalizes optional empty values', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: {
        inputPlaceholder: '  Ask a question  ',
        submitButtonText: '   ',
        showMessageTimestamps: true,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0]?.chatConfig).toMatchObject({
      inputPlaceholder: 'Ask a question',
      submitButtonText: null,
      showMessageTimestamps: true,
    });
  });
});
