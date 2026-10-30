export interface ChatWidgetProps {
  deploymentKey: string;
  apiUrl: string;
  initiallyOpen?: boolean;
  openDelay?: number;
  displayMode?: "floating" | "inline";
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
}

export interface ChatState {
  conversationId?: string;
  messages: WidgetMessage[];
  isGenerating: boolean;
  activeAssistantId?: string;
}

export type ChatAction =
  | { type: "start"; userId: string; assistantId: string; content: string }
  | { type: "clear" }
  | { type: "event"; event: ChatEvent }
  | { type: "failed"; message: string }
  | { type: "stopped" };
