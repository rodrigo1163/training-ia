import type {
  BotStyle,
  ChatColorPalette,
  ChatConfig,
  ChatTheme,
} from "../types/chat";

type ResolvedBotStyle = Omit<
  BotStyle,
  | "launcherSize"
  | "launcherIcon"
  | "chatBorderWidth"
  | "chatFontFamily"
  | "chatMessageFontSize"
  | "chatWidth"
  | "chatHeight"
  | "chatRadius"
  | "messageRadius"
  | "chatShadow"
  | "floatingPosition"
> & {
  launcherSize: number;
  launcherIcon: NonNullable<BotStyle["launcherIcon"]>;
  chatBorderWidth: number;
  chatFontFamily: NonNullable<BotStyle["chatFontFamily"]>;
  chatMessageFontSize: NonNullable<BotStyle["chatMessageFontSize"]>;
  chatWidth: number;
  chatHeight: number;
  chatRadius: number;
  messageRadius: number;
  chatShadow: NonNullable<BotStyle["chatShadow"]>;
  floatingPosition: NonNullable<BotStyle["floatingPosition"]>;
};

export type ResolvedChatConfig = Omit<
  ChatConfig,
  | "style"
  | "inputPlaceholder"
  | "submitButtonText"
  | "initialMessage"
  | "assistantName"
> & {
  inputPlaceholder: string;
  submitButtonText: string;
  initialMessage: string;
  assistantName: string;
  style: ResolvedBotStyle;
};

const emptyColorPalette: ChatColorPalette = {
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

const defaultDarkColorPalette: ChatColorPalette = {
  chatBackgroundColor: "#111827",
  headerFooterBackgroundColor: "#1f2937",
  footerBackgroundColor: "#1f2937",
  inputBackgroundColor: "#111827",
  inputTextColor: "#f9fafb",
  starterQuestionsTextColor: "#f9fafb",
  assistantMessageBackgroundColor: "#1f2937",
  assistantMessageTextColor: "#f9fafb",
  userMessageBackgroundColor: "#2563eb",
  userMessageTextColor: "#ffffff",
  launcherBackgroundColor: "#2563eb",
  chatBorderColor: "#374151",
};

const defaultStyle: ResolvedBotStyle = {
  colors: {
    light: { ...emptyColorPalette },
    dark: { ...emptyColorPalette },
  },
  avatarUrl: null,
  launcherSize: 56,
  launcherIcon: "chat",
  chatBorderWidth: 0,
  chatFontFamily: "sans",
  chatMessageFontSize: "md",
  chatWidth: 424,
  chatHeight: 676,
  chatRadius: 12,
  messageRadius: 8,
  chatShadow: "2xl",
  floatingPosition: "bottom-right",
};

export const defaultChatConfig: ResolvedChatConfig = {
  inputPlaceholder: "Type your message...",
  submitButtonText: "Send",
  showMessageTimestamps: false,
  starterQuestions: [],
  generateStarterQuestionsAfterResponse: false,
  initialMessage: "Hello! 👋 How can I help you today?",
  assistantName: "Virtual Assistant",
  headerStatusText: "We are online",
  style: defaultStyle,
};

function resolveColorPalette(
  theme: ChatTheme,
  style?: BotStyle,
): ChatColorPalette {
  const configuredColors = style?.colors[theme];

  if (theme === "dark") {
    return {
      chatBackgroundColor:
        configuredColors?.chatBackgroundColor ??
        defaultDarkColorPalette.chatBackgroundColor,
      headerFooterBackgroundColor:
        configuredColors?.headerFooterBackgroundColor ??
        defaultDarkColorPalette.headerFooterBackgroundColor,
      footerBackgroundColor:
        configuredColors?.footerBackgroundColor ??
        defaultDarkColorPalette.footerBackgroundColor,
      inputBackgroundColor:
        configuredColors?.inputBackgroundColor ??
        defaultDarkColorPalette.inputBackgroundColor,
      inputTextColor:
        configuredColors?.inputTextColor ??
        defaultDarkColorPalette.inputTextColor,
      starterQuestionsTextColor:
        configuredColors?.starterQuestionsTextColor ??
        defaultDarkColorPalette.starterQuestionsTextColor,
      assistantMessageBackgroundColor:
        configuredColors?.assistantMessageBackgroundColor ??
        defaultDarkColorPalette.assistantMessageBackgroundColor,
      assistantMessageTextColor:
        configuredColors?.assistantMessageTextColor ??
        defaultDarkColorPalette.assistantMessageTextColor,
      userMessageBackgroundColor:
        configuredColors?.userMessageBackgroundColor ??
        defaultDarkColorPalette.userMessageBackgroundColor,
      userMessageTextColor:
        configuredColors?.userMessageTextColor ??
        defaultDarkColorPalette.userMessageTextColor,
      launcherBackgroundColor:
        configuredColors?.launcherBackgroundColor ??
        defaultDarkColorPalette.launcherBackgroundColor,
      chatBorderColor:
        configuredColors?.chatBorderColor ??
        defaultDarkColorPalette.chatBorderColor,
    };
  }

  return {
    ...emptyColorPalette,
    ...configuredColors,
    inputBackgroundColor: configuredColors?.inputBackgroundColor ?? "#ffffff",
    inputTextColor: configuredColors?.inputTextColor ?? "#111827",
  };
}

function resolveStyle(style?: BotStyle): ResolvedBotStyle {
  return {
    colors: {
      light: resolveColorPalette("light", style),
      dark: resolveColorPalette("dark", style),
    },
    avatarUrl: style?.avatarUrl ?? defaultStyle.avatarUrl,
    launcherSize: style?.launcherSize ?? defaultStyle.launcherSize,
    launcherIcon: style?.launcherIcon ?? defaultStyle.launcherIcon,
    chatBorderWidth: style?.chatBorderWidth ?? defaultStyle.chatBorderWidth,
    chatFontFamily: style?.chatFontFamily ?? defaultStyle.chatFontFamily,
    chatMessageFontSize:
      style?.chatMessageFontSize ?? defaultStyle.chatMessageFontSize,
    chatWidth: style?.chatWidth ?? defaultStyle.chatWidth,
    chatHeight: style?.chatHeight ?? defaultStyle.chatHeight,
    chatRadius: style?.chatRadius ?? defaultStyle.chatRadius,
    messageRadius: style?.messageRadius ?? defaultStyle.messageRadius,
    chatShadow: style?.chatShadow ?? defaultStyle.chatShadow,
    floatingPosition: style?.floatingPosition ?? defaultStyle.floatingPosition,
  };
}

export function resolveChatConfig(
  config?: Partial<ChatConfig> | null,
): ResolvedChatConfig {
  return {
    inputPlaceholder:
      config?.inputPlaceholder ?? defaultChatConfig.inputPlaceholder,
    submitButtonText:
      config?.submitButtonText ?? defaultChatConfig.submitButtonText,
    showMessageTimestamps:
      config?.showMessageTimestamps ?? defaultChatConfig.showMessageTimestamps,
    starterQuestions:
      config?.starterQuestions ?? defaultChatConfig.starterQuestions,
    generateStarterQuestionsAfterResponse:
      config?.generateStarterQuestionsAfterResponse ?? false,
    initialMessage: config?.initialMessage ?? defaultChatConfig.initialMessage,
    assistantName:
      config?.assistantName?.trim() || defaultChatConfig.assistantName,
    headerStatusText:
      config?.headerStatusText === null
        ? null
        : (config?.headerStatusText ?? defaultChatConfig.headerStatusText),
    style: resolveStyle(config?.style),
  };
}
