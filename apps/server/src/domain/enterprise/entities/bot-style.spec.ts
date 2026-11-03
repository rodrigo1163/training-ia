import {
  createDefaultBotStyle,
  InvalidBotStyleError,
  validateBotStyle,
} from './bot-style';

describe('BotStyle', () => {
  it('creates complete light and dark color palettes and shared defaults', () => {
    const style = createDefaultBotStyle();

    expect(Object.keys(style.colors.light).sort()).toEqual(
      Object.keys(style.colors.dark).sort(),
    );
    expect(style.colors.light).toEqual({
      chatBackgroundColor: null,
      headerFooterBackgroundColor: null,
      footerBackgroundColor: null,
      inputBackgroundColor: null,
      inputTextColor: null,
      starterQuestionsTextColor: null,
      assistantMessageBackgroundColor: null,
      assistantMessageTextColor: null,
      userMessageBackgroundColor: null,
      userMessageTextColor: null,
      launcherBackgroundColor: null,
      chatBorderColor: null,
    });
    expect(style).toMatchObject({
      avatarUrl: null,
      launcherSize: null,
      launcherIcon: null,
      chatBorderWidth: null,
      chatFontFamily: null,
      chatMessageFontSize: null,
      chatWidth: null,
      chatHeight: null,
      chatRadius: null,
      messageRadius: null,
      chatShadow: null,
      floatingPosition: null,
    });
  });

  it('accepts independently configured color palettes', () => {
    const style = createDefaultBotStyle();
    style.colors.light.chatBackgroundColor = '#ffffff';
    style.colors.dark.chatBackgroundColor = 'rgba(17, 24, 39, 0.8)';

    expect(validateBotStyle(style)).toBeNull();
  });

  it('rejects invalid colors', () => {
    const style = createDefaultBotStyle();
    style.colors.dark.chatBackgroundColor = 'not-a-color';

    expect(validateBotStyle(style)).toMatchObject({
      message: 'dark.chatBackgroundColor must be a valid CSS color.',
    });
  });

  it.each([
    ['chatWidth', 319],
    ['chatWidth', 601],
    ['chatHeight', 479],
    ['chatHeight', 801],
    ['chatRadius', -1],
    ['chatRadius', 33],
    ['messageRadius', -1],
    ['messageRadius', 25],
    ['launcherSize', 47],
    ['launcherSize', 49],
    ['launcherSize', 73],
    ['chatBorderWidth', -1],
    ['chatBorderWidth', 5],
  ] as const)('rejects an invalid style value: %s=%s', (field, value) => {
    const style = { ...createDefaultBotStyle(), [field]: value };

    expect(validateBotStyle(style as never)).toBeInstanceOf(
      InvalidBotStyleError,
    );
  });

  it('rejects unknown shadow and floating position values', () => {
    expect(
      validateBotStyle({
        ...createDefaultBotStyle(),
        chatShadow: 'huge' as never,
      }),
    ).toMatchObject({ message: 'chatShadow must be a valid shadow.' });
    expect(
      validateBotStyle({
        ...createDefaultBotStyle(),
        floatingPosition: 'top' as never,
      }),
    ).toMatchObject({ message: 'floatingPosition must be a valid position.' });
  });

  it('accepts appearance options and launcher size bounds', () => {
    expect(
      validateBotStyle({
        ...createDefaultBotStyle(),
        launcherIcon: 'avatar',
        launcherSize: 72,
        chatBorderWidth: 4,
        chatFontFamily: 'serif',
        chatMessageFontSize: 'lg',
      }),
    ).toBeNull();
  });

  it.each([
    ['launcherIcon', 'question'],
    ['chatFontFamily', 'comic-sans'],
    ['chatMessageFontSize', 'xl'],
  ] as const)('rejects an unknown appearance option: %s', (field, value) => {
    const style = { ...createDefaultBotStyle(), [field]: value };

    expect(validateBotStyle(style as never)).toBeInstanceOf(
      InvalidBotStyleError,
    );
  });

  it('validates the avatar URL stored in style', () => {
    expect(
      validateBotStyle({
        ...createDefaultBotStyle(),
        avatarUrl: 'not-a-url',
      }),
    ).toMatchObject({ message: 'avatarUrl must be a valid URL.' });
  });
});
