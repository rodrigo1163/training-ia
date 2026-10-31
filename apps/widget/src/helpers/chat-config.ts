import type { ChatConfig } from "../types/chat";

export type ResolvedChatConfig = {
  avatarUrl: string | null;
  inputPlaceholder: string;
  submitButtonText: string;
  showMessageTimestamps: boolean;
  starterQuestions: string[];
  generateStarterQuestionsAfterResponse: boolean;
  initialMessage: string;
  headerStatusText: string;
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  assistantMessageBackgroundColor: string | null;
  userMessageBackgroundColor: string | null;
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
  assistantMessageBackgroundColor: null,
  userMessageBackgroundColor: null,
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
    starterQuestions: config?.starterQuestions ?? defaultChatConfig.starterQuestions,
    generateStarterQuestionsAfterResponse:
      config?.generateStarterQuestionsAfterResponse ??
      defaultChatConfig.generateStarterQuestionsAfterResponse,
    initialMessage: config?.initialMessage ?? defaultChatConfig.initialMessage,
    headerStatusText:
      config?.headerStatusText ?? defaultChatConfig.headerStatusText,
    chatBackgroundColor:
      config?.chatBackgroundColor ?? defaultChatConfig.chatBackgroundColor,
    headerFooterBackgroundColor:
      config?.headerFooterBackgroundColor ??
      defaultChatConfig.headerFooterBackgroundColor,
    assistantMessageBackgroundColor:
      config?.assistantMessageBackgroundColor ??
      defaultChatConfig.assistantMessageBackgroundColor,
    userMessageBackgroundColor:
      config?.userMessageBackgroundColor ??
      defaultChatConfig.userMessageBackgroundColor,
  };
}
