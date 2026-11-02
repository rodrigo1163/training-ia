import type { ChatLimitErrorCode } from "@training-ia/contracts";

export type { ChatLimitErrorCode };

export interface ChatConfig {
  avatarUrl: string | null;
  inputPlaceholder: string | null;
  submitButtonText: string | null;
  showMessageTimestamps: boolean;
  starterQuestions: string[];
  generateStarterQuestionsAfterResponse: boolean;
  initialMessage: string | null;
  headerStatusText: string | null;
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  footerBackgroundColor: string | null;
  inputBackgroundColor: string | null;
  inputTextColor: string | null;
  starterQuestionsTextColor: string | null;
  assistantMessageBackgroundColor: string | null;
  userMessageBackgroundColor: string | null;
  chatWidth: number | null;
  chatHeight: number | null;
  chatRadius: number | null;
  messageRadius: number | null;
  chatShadow: "none" | "sm" | "md" | "lg" | "2xl" | null;
  floatingPosition: "bottom-right" | "bottom-left" | null;
}

export interface ChatWidgetProps {
  deploymentKey: string;
  apiUrl: string;
  initiallyOpen?: boolean;
  openDelay?: number;
  displayMode?: "floating" | "inline";
  mode?: "test" | "public";
  chatConfig?: ChatConfig;
  onFloatingPositionChange?: (position: "bottom-right" | "bottom-left") => void;
}

export type ChatContext = {
  pageUrl?: string;
  pageTitle?: string;
  locale?: string;
};

export type SendMessageInput = {
  apiUrl: string;
  deploymentKey: string;
  conversationId?: string;
  clientMessageId: string;
  content: string;
  context?: ChatContext;
  displayedStarterQuestions?: string[];
  signal: AbortSignal;
};

export type GenerateStarterQuestionInput = {
  apiUrl: string;
  deploymentKey: string;
  conversationId: string;
  userMessageId: string;
  slot: number;
  clickedQuestion: string;
  signal: AbortSignal;
};

export type GenerateStarterQuestionOutput = {
  question: string | null;
};

export type ChatEvent =
  | {
      type: "metadata";
      data: {
        conversationId: string;
        userMessageId: string;
        assistantMessageId: string;
      };
    }
  | { type: "delta"; data: { content: string } }
  | {
      type: "completed";
      data: { model: string; inputTokens?: number; outputTokens?: number };
    }
  | { type: "error"; data: { code?: string; message?: string } };

export interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
  stopped?: boolean;
  createdAt?: string;
}

export interface ChatState {
  conversationId?: string;
  messages: WidgetMessage[];
  starterQuestions: string[];
  isGenerating: boolean;
  activeAssistantId?: string;
  errorCode?: ChatLimitErrorCode;
}

export type ChatAction =
  | {
      type: "start";
      userId: string;
      assistantId: string;
      content: string;
      starterQuestionSlot?: number;
    }
  | { type: "clear"; initialMessage: string; starterQuestions: string[] }
  | { type: "set-initial-message"; content: string }
  | { type: "set-starter-questions"; starterQuestions: string[] }
  | { type: "starter-question-generated"; slot: number; question: string }
  | { type: "event"; event: ChatEvent }
  | {
      type: "failed";
      message: string;
      code?: ChatLimitErrorCode;
    }
  | { type: "stopped" };
