import type { ChatConfig } from "../types/chat";

export type ResolvedChatConfig = {
  avatarUrl: string | null;
  inputPlaceholder: string;
  submitButtonText: string;
  showMessageTimestamps: boolean;
  starterQuestions: string[];
  generateStarterQuestionsAfterResponse: boolean;
  initialMessage: string;
  headerStatusText: string | null;
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  footerBackgroundColor: string | null;
  inputBackgroundColor: string | null;
  inputTextColor: string | null;
  starterQuestionsTextColor: string | null;
  assistantMessageBackgroundColor: string | null;
  userMessageBackgroundColor: string | null;
  assistantMessageTextColor: string | null;
  userMessageTextColor: string | null;
  launcherBackgroundColor: string | null;
  launcherSize: number;
  launcherIcon: "chat" | "bot" | "sparkles" | "avatar";
  chatBorderColor: string | null;
  chatBorderWidth: number;
  chatFontFamily: "sans" | "serif" | "mono";
  chatMessageFontSize: "sm" | "md" | "lg";
  chatWidth: number;
  chatHeight: number;
  chatRadius: number;
  messageRadius: number;
  chatShadow: "none" | "sm" | "md" | "lg" | "2xl";
  floatingPosition: "bottom-right" | "bottom-left";
};

export const defaultChatConfig: ResolvedChatConfig = {
  avatarUrl: null,
  inputPlaceholder: "Type your message...",
  submitButtonText: "Send",
  showMessageTimestamps: false,
  starterQuestions: [],
  generateStarterQuestionsAfterResponse: false,
  initialMessage: "Hello! 👋 How can I help you today?",
  headerStatusText: "We are online",
  chatBackgroundColor: null,
  headerFooterBackgroundColor: null,
  footerBackgroundColor: null,
  inputBackgroundColor: null,
  inputTextColor: null,
  starterQuestionsTextColor: null,
  assistantMessageBackgroundColor: null,
  userMessageBackgroundColor: null,
  assistantMessageTextColor: null,
  userMessageTextColor: null,
  launcherBackgroundColor: null,
  launcherSize: 56,
  launcherIcon: "chat",
  chatBorderColor: null,
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

export function resolveChatConfig(
  config?: Partial<ChatConfig> | null,
): ResolvedChatConfig {
  return {
    avatarUrl: config?.avatarUrl ?? defaultChatConfig.avatarUrl,
    inputPlaceholder:
      config?.inputPlaceholder ?? defaultChatConfig.inputPlaceholder,
    submitButtonText:
      config?.submitButtonText ?? defaultChatConfig.submitButtonText,
    showMessageTimestamps:
      config?.showMessageTimestamps ?? defaultChatConfig.showMessageTimestamps,
    starterQuestions:
      config?.starterQuestions ?? defaultChatConfig.starterQuestions,
    generateStarterQuestionsAfterResponse:
      config?.generateStarterQuestionsAfterResponse ??
      defaultChatConfig.generateStarterQuestionsAfterResponse,
    initialMessage: config?.initialMessage ?? defaultChatConfig.initialMessage,
    headerStatusText:
      config?.headerStatusText === null
        ? null
        : (config?.headerStatusText ?? defaultChatConfig.headerStatusText),
    chatBackgroundColor:
      config?.chatBackgroundColor ?? defaultChatConfig.chatBackgroundColor,
    headerFooterBackgroundColor:
      config?.headerFooterBackgroundColor ??
      defaultChatConfig.headerFooterBackgroundColor,
    footerBackgroundColor:
      config?.footerBackgroundColor ?? defaultChatConfig.footerBackgroundColor,
    inputBackgroundColor:
      config?.inputBackgroundColor ?? defaultChatConfig.inputBackgroundColor,
    inputTextColor: config?.inputTextColor ?? defaultChatConfig.inputTextColor,
    starterQuestionsTextColor:
      config?.starterQuestionsTextColor ??
      defaultChatConfig.starterQuestionsTextColor,
    assistantMessageBackgroundColor:
      config?.assistantMessageBackgroundColor ??
      defaultChatConfig.assistantMessageBackgroundColor,
    userMessageBackgroundColor:
      config?.userMessageBackgroundColor ??
      defaultChatConfig.userMessageBackgroundColor,
    assistantMessageTextColor:
      config?.assistantMessageTextColor ??
      defaultChatConfig.assistantMessageTextColor,
    userMessageTextColor:
      config?.userMessageTextColor ?? defaultChatConfig.userMessageTextColor,
    launcherBackgroundColor:
      config?.launcherBackgroundColor ??
      defaultChatConfig.launcherBackgroundColor,
    launcherSize: config?.launcherSize ?? defaultChatConfig.launcherSize,
    launcherIcon: config?.launcherIcon ?? defaultChatConfig.launcherIcon,
    chatBorderColor:
      config?.chatBorderColor ?? defaultChatConfig.chatBorderColor,
    chatBorderWidth: config?.chatBorderWidth ?? defaultChatConfig.chatBorderWidth,
    chatFontFamily: config?.chatFontFamily ?? defaultChatConfig.chatFontFamily,
    chatMessageFontSize:
      config?.chatMessageFontSize ?? defaultChatConfig.chatMessageFontSize,
    chatWidth: config?.chatWidth ?? defaultChatConfig.chatWidth,
    chatHeight: config?.chatHeight ?? defaultChatConfig.chatHeight,
    chatRadius: config?.chatRadius ?? defaultChatConfig.chatRadius,
    messageRadius: config?.messageRadius ?? defaultChatConfig.messageRadius,
    chatShadow: config?.chatShadow ?? defaultChatConfig.chatShadow,
    floatingPosition:
      config?.floatingPosition ?? defaultChatConfig.floatingPosition,
  };
}
