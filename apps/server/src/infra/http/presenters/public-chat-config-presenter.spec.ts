import { createDefaultChatConfig } from '@/domain/enterprise/entities/chat-config';
import { PublicChatConfigPresenter } from './public-chat-config-presenter';

describe('Public chat config presenter', () => {
  it('includes the style settings required by the widget', () => {
    const config = {
      ...createDefaultChatConfig(),
      assistantMessageTextColor: '#111827',
      userMessageTextColor: '#ffffff',
      launcherBackgroundColor: '#0865cf',
      launcherSize: 64,
      launcherIcon: 'avatar' as const,
      chatBorderColor: '#d1d5db',
      chatBorderWidth: 2,
      chatFontFamily: 'serif' as const,
      chatMessageFontSize: 'lg' as const,
    };

    expect(PublicChatConfigPresenter.toHTTP(config)).toMatchObject({
      assistantMessageTextColor: '#111827',
      userMessageTextColor: '#ffffff',
      launcherBackgroundColor: '#0865cf',
      launcherSize: 64,
      launcherIcon: 'avatar',
      chatBorderColor: '#d1d5db',
      chatBorderWidth: 2,
      chatFontFamily: 'serif',
      chatMessageFontSize: 'lg',
    });
  });

  it('does not expose the private avatar storage key', () => {
    const config = {
      ...createDefaultChatConfig(),
      avatarStorageKey: 'chat-avatars/bot-1/avatar.webp',
    };

    expect(PublicChatConfigPresenter.toHTTP(config)).not.toHaveProperty(
      'avatarStorageKey',
    );
  });
});
