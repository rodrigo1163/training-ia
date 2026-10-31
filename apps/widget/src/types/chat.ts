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
  assistantMessageBackgroundColor: string | null;
  userMessageBackgroundColor: string | null;
}

export interface ChatWidgetProps {
  deploymentKey: string;
  apiUrl: string;
  initiallyOpen?: boolean;
  openDelay?: number;
  displayMode?: "floating" | "inline";
  mode?: "test" | "public";
  chatConfig?: ChatConfig;
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
  signal: AbortSignal;
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
  | { type: "error"; data: { code: string; message: string } };

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
  isGenerating: boolean;
  activeAssistantId?: string;
}

export type ChatAction =
  | { type: "start"; userId: string; assistantId: string; content: string }
  | { type: "clear"; initialMessage: string }
  | { type: "set-initial-message"; content: string }
  | { type: "event"; event: ChatEvent }
  | { type: "failed"; message: string }
  | { type: "stopped" };
