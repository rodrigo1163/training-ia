export const chatThemes = ['light', 'dark'] as const;
export type ChatTheme = (typeof chatThemes)[number];

export interface ChatColorPalette {
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  footerBackgroundColor: string | null;
  inputBackgroundColor: string | null;
  inputTextColor: string | null;
  starterQuestionsTextColor: string | null;
  assistantMessageBackgroundColor: string | null;
  assistantMessageTextColor: string | null;
  userMessageBackgroundColor: string | null;
  userMessageTextColor: string | null;
  launcherBackgroundColor: string | null;
  chatBorderColor: string | null;
}

export const chatShadows = ['none', 'sm', 'md', 'lg', '2xl'] as const;
export type ChatShadow = (typeof chatShadows)[number];

export const floatingPositions = ['bottom-right', 'bottom-left'] as const;
export type FloatingPosition = (typeof floatingPositions)[number];

export const launcherIcons = ['chat', 'bot', 'sparkles', 'avatar'] as const;
export type LauncherIcon = (typeof launcherIcons)[number];

export const chatFontFamilies = ['sans', 'serif', 'mono'] as const;
export type ChatFontFamily = (typeof chatFontFamilies)[number];

export const chatMessageFontSizes = ['sm', 'md', 'lg'] as const;
export type ChatMessageFontSize = (typeof chatMessageFontSizes)[number];

export const CHAT_STYLE_LIMITS = {
  chatWidth: { min: 320, max: 600 },
  chatHeight: { min: 480, max: 800 },
  chatRadius: { min: 0, max: 32 },
  messageRadius: { min: 0, max: 24 },
  launcherSize: { min: 48, max: 72, step: 4 },
  chatBorderWidth: { min: 0, max: 4 },
} as const;

export interface BotStyle {
  colors: Record<ChatTheme, ChatColorPalette>;
  avatarUrl: string | null;
  launcherSize: number | null;
  launcherIcon: LauncherIcon | null;
  chatBorderWidth: number | null;
  chatFontFamily: ChatFontFamily | null;
  chatMessageFontSize: ChatMessageFontSize | null;
  chatWidth: number | null;
  chatHeight: number | null;
  chatRadius: number | null;
  messageRadius: number | null;
  chatShadow: ChatShadow | null;
  floatingPosition: FloatingPosition | null;
}

export const CHAT_COLOR_FIELDS = [
  'chatBackgroundColor',
  'headerFooterBackgroundColor',
  'footerBackgroundColor',
  'inputBackgroundColor',
  'inputTextColor',
  'starterQuestionsTextColor',
  'assistantMessageBackgroundColor',
  'assistantMessageTextColor',
  'userMessageBackgroundColor',
  'userMessageTextColor',
  'launcherBackgroundColor',
  'chatBorderColor',
] as const satisfies readonly (keyof ChatColorPalette)[];

const colorPattern =
  /^(?:#[\da-f]{3,4}|#[\da-f]{6}(?:[\da-f]{2})?|rgba?\(\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\)|hsla?\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\))$/i;

export class InvalidBotStyleError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function validateNullableNumber(
  field: string,
  value: unknown,
  options: { min: number; max: number },
): InvalidBotStyleError | null {
  if (value === null) return null;

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < options.min ||
    value > options.max
  ) {
    return new InvalidBotStyleError(
      `${field} must be an integer between ${options.min} and ${options.max}.`,
    );
  }

  return null;
}

export function createDefaultBotStyle(): BotStyle {
  const colors: ChatColorPalette = {
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
  };

  return {
    colors: {
      light: { ...colors },
      dark: { ...colors },
    },
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
  };
}

export function validateBotStyle(style: BotStyle): InvalidBotStyleError | null {
  if (style.avatarUrl !== null) {
    if (typeof style.avatarUrl !== 'string' || style.avatarUrl.length > 2000) {
      return new InvalidBotStyleError(
        'avatarUrl must be at most 2000 characters.',
      );
    }

    try {
      new URL(style.avatarUrl);
    } catch {
      return new InvalidBotStyleError('avatarUrl must be a valid URL.');
    }
  }

  for (const theme of chatThemes) {
    for (const field of CHAT_COLOR_FIELDS) {
      const value = style.colors[theme][field];
      if (
        value !== null &&
        (typeof value !== 'string' || !colorPattern.test(value))
      ) {
        return new InvalidBotStyleError(
          `${theme}.${field} must be a valid CSS color.`,
        );
      }
    }
  }

  for (const [field, limits] of Object.entries(CHAT_STYLE_LIMITS)) {
    const error = validateNullableNumber(
      field,
      style[field as keyof typeof CHAT_STYLE_LIMITS],
      limits,
    );
    if (error) return error;
  }

  if (
    style.launcherSize !== null &&
    (style.launcherSize - CHAT_STYLE_LIMITS.launcherSize.min) %
      CHAT_STYLE_LIMITS.launcherSize.step !==
      0
  ) {
    return new InvalidBotStyleError(
      'launcherSize must be 48, 52, 56, 60, 64, 68, or 72 px.',
    );
  }

  if (
    style.launcherIcon !== null &&
    !launcherIcons.includes(style.launcherIcon)
  ) {
    return new InvalidBotStyleError('launcherIcon must be a valid icon.');
  }
  if (
    style.chatFontFamily !== null &&
    !chatFontFamilies.includes(style.chatFontFamily)
  ) {
    return new InvalidBotStyleError(
      'chatFontFamily must be a valid font family.',
    );
  }
  if (
    style.chatMessageFontSize !== null &&
    !chatMessageFontSizes.includes(style.chatMessageFontSize)
  ) {
    return new InvalidBotStyleError(
      'chatMessageFontSize must be a valid font size.',
    );
  }
  if (style.chatShadow !== null && !chatShadows.includes(style.chatShadow)) {
    return new InvalidBotStyleError('chatShadow must be a valid shadow.');
  }
  if (
    style.floatingPosition !== null &&
    !floatingPositions.includes(style.floatingPosition)
  ) {
    return new InvalidBotStyleError(
      'floatingPosition must be a valid position.',
    );
  }

  return null;
}
