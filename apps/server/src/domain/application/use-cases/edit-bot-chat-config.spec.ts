import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { InvalidChatConfigError } from '../../enterprise/entities/chat-config';
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

  it('returns domain validation errors without persisting the update', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: { temperature: 3 },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidChatConfigError);
    expect(bots.items[0]?.chatConfig.temperature).toBeNull();
  });

  it('rejects a model outside the shared catalog', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: { model: 'provider/unknown-model' },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidChatConfigError);
    expect(bots.items[0]?.chatConfig.model).toBeNull();
  });

  it('saves valid message limits and clears them with null', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: {
        maxMessagesPerDay: 100,
        maxUserMessagesPerConversation: 20,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0]?.chatConfig).toMatchObject({
      maxMessagesPerDay: 100,
      maxUserMessagesPerConversation: 20,
    });

    const clearResult = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: {
        maxMessagesPerDay: null,
        maxUserMessagesPerConversation: null,
      },
    });

    expect(clearResult.isRight()).toBe(true);
    expect(bots.items[0]?.chatConfig).toMatchObject({
      maxMessagesPerDay: null,
      maxUserMessagesPerConversation: null,
    });
  });

  it.each([0, -1, 1.5, 1_000_001])(
    'rejects an invalid message limit: %s',
    async (limit) => {
      const result = await sut.execute({
        organizationMember,
        botSlug: 'support-bot',
        patch: { maxMessagesPerDay: limit },
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidChatConfigError);
      expect(bots.items[0]?.chatConfig.maxMessagesPerDay).toBeNull();
    },
  );

  it('persists the chat style settings', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      patch: {
        footerBackgroundColor: '#111827',
        inputBackgroundColor: '#ffffff',
        inputTextColor: '#111827',
        starterQuestionsTextColor: '#0865cf',
        assistantMessageTextColor: '#111827',
        userMessageTextColor: '#ffffff',
        launcherBackgroundColor: '#0865cf',
        launcherSize: 64,
        launcherIcon: 'sparkles',
        chatBorderColor: '#d1d5db',
        chatBorderWidth: 2,
        chatFontFamily: 'mono',
        chatMessageFontSize: 'sm',
        chatWidth: 520,
        chatHeight: 720,
        chatRadius: 16,
        messageRadius: 10,
        chatShadow: 'lg',
        floatingPosition: 'bottom-left',
      },
    });

    expect(result.isRight()).toBe(true);
    expect(bots.items[0]?.chatConfig).toMatchObject({
      footerBackgroundColor: '#111827',
      inputBackgroundColor: '#ffffff',
      inputTextColor: '#111827',
      starterQuestionsTextColor: '#0865cf',
      assistantMessageTextColor: '#111827',
      userMessageTextColor: '#ffffff',
      launcherBackgroundColor: '#0865cf',
      launcherSize: 64,
      launcherIcon: 'sparkles',
      chatBorderColor: '#d1d5db',
      chatBorderWidth: 2,
      chatFontFamily: 'mono',
      chatMessageFontSize: 'sm',
      chatWidth: 520,
      chatHeight: 720,
      chatRadius: 16,
      messageRadius: 10,
      chatShadow: 'lg',
      floatingPosition: 'bottom-left',
    });
  });
});
