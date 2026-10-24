import type { ChatAction, ChatState } from "../types/chat";

export const initialChatState: ChatState = {
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! 👋 How can I help you today?",
    },
  ],
  isGenerating: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  if (action.type === "start") {
    return {
      ...state,
      isGenerating: true,
      activeAssistantId: action.assistantId,
      messages: [
        ...state.messages,
        { id: action.userId, role: "user", content: action.content },
        { id: action.assistantId, role: "assistant", content: "" },
      ],
    };
  }
  if (action.type === "failed") {
    return {
      ...state,
      isGenerating: false,
      activeAssistantId: undefined,
      messages: state.messages.map((message) =>
        message.id === state.activeAssistantId
          ? {
              ...message,
              content: message.content || action.message,
              failed: true,
            }
          : message,
      ),
    };
  }
  if (action.type === "stopped") {
    return {
      ...state,
      isGenerating: false,
      activeAssistantId: undefined,
      messages: state.messages.map((message) =>
        message.id === state.activeAssistantId
          ? {
              ...message,
              content: message.content || "Response stopped.",
              stopped: true,
            }
          : message,
      ),
    };
  }
  const event = action.event;
  if (event.type === "metadata")
    return { ...state, conversationId: event.data.conversationId };
  if (event.type === "delta") {
    return {
      ...state,
      messages: state.messages.map((message) =>
        message.id === state.activeAssistantId
          ? { ...message, content: message.content + event.data.content }
          : message,
      ),
    };
  }
  if (event.type === "error")
    return chatReducer(state, { type: "failed", message: event.data.message });
  return { ...state, isGenerating: false, activeAssistantId: undefined };
}
