import { createDefaultChatConfig } from '@/domain/enterprise/entities/chat-config';
import { createDefaultBotStyle } from '@/domain/enterprise/entities/bot-style';
import { PublicChatConfigPresenter } from './public-chat-config-presenter';

describe('Public chat config presenter', () => {
  it('includes the style settings required by the widget', () => {
    const config = {
      ...createDefaultChatConfig(),
    };
    const style = {
      ...createDefaultBotStyle(),
      colors: {
        ...createDefaultBotStyle().colors,
        light: {
          ...createDefaultBotStyle().colors.light,
          assistantMessageTextColor: '#111827',
          userMessageTextColor: '#ffffff',
          launcherBackgroundColor: '#0865cf',
          chatBorderColor: '#d1d5db',
        },
      },
      launcherSize: 64,
      launcherIcon: 'avatar' as const,
      chatBorderWidth: 2,
      chatFontFamily: 'serif' as const,
      chatMessageFontSize: 'lg' as const,
    };

    expect(PublicChatConfigPresenter.toHTTP(config, style)).toMatchObject({
      style: {
        colors: {
          light: {
            assistantMessageTextColor: '#111827',
            userMessageTextColor: '#ffffff',
            launcherBackgroundColor: '#0865cf',
            chatBorderColor: '#d1d5db',
          },
        },
        launcherSize: 64,
        launcherIcon: 'avatar',
        chatBorderWidth: 2,
        chatFontFamily: 'serif',
        chatMessageFontSize: 'lg',
      },
    });
  });

  it('does not expose the private avatar storage key', () => {
    const config = {
      ...createDefaultChatConfig(),
      avatarStorageKey: 'chat-avatars/bot-1/avatar.webp',
    };

    expect(
      PublicChatConfigPresenter.toHTTP(config, createDefaultBotStyle()),
    ).not.toHaveProperty('avatarStorageKey');
  });
});
