import type { ChatAction, ChatState } from "../types/chat.ts";
import {
  CHAT_LIMIT_ERROR_CODES,
  getChatErrorMessage,
  isChatLimitErrorCode,
} from "./chat-errors.ts";

export function createInitialChatState(
  initialMessage: string,
  starterQuestions: string[] = [],
): ChatState {
  return {
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: initialMessage,
        createdAt: new Date().toISOString(),
      },
    ],
    starterQuestions,
    isGenerating: false,
  };
}

export const initialChatState = createInitialChatState(
  "Hello! 👋 How can I help you today?",
);

export function canClearConversation(
  mode: "test" | "public",
  errorCode: ChatState["errorCode"],
) {
  return mode === "test" && errorCode !== CHAT_LIMIT_ERROR_CODES.daily;
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  if (action.type === "clear") {
    return createInitialChatState(
      action.initialMessage,
      action.starterQuestions,
    );
  }

  if (action.type === "set-initial-message") {
    if (state.isGenerating || state.messages.length !== 1) return state;

    return {
      ...state,
      messages: [
        {
          ...state.messages[0],
          content: action.content,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  if (action.type === "set-starter-questions") {
    if (state.isGenerating || state.messages.length !== 1) return state;

    return { ...state, starterQuestions: action.starterQuestions };
  }

  if (action.type === "start") {
    return {
      ...state,
      isGenerating: true,
      activeAssistantId: action.assistantId,
      errorCode: undefined,
      starterQuestions:
        action.starterQuestionSlot === undefined
          ? state.starterQuestions
          : state.starterQuestions.map((question, index) =>
              index === action.starterQuestionSlot ? "" : question,
            ),
      messages: [
        ...state.messages,
        {
          id: action.userId,
          role: "user",
          content: action.content,
          createdAt: new Date().toISOString(),
        },
        { id: action.assistantId, role: "assistant", content: "" },
      ],
    };
  }
  if (action.type === "starter-question-generated") {
    return {
      ...state,
      starterQuestions: state.starterQuestions.map((question, index) =>
        index === action.slot ? action.question : question,
      ),
    };
  }
  if (action.type === "failed") {
    return {
      ...state,
      isGenerating: false,
      activeAssistantId: undefined,
      errorCode: action.code,
      messages: state.messages.map((message) =>
        message.id === state.activeAssistantId
          ? {
              ...message,
              content: action.code
                ? getChatErrorMessage(action.code, action.message)
                : message.content || action.message,
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
          ? {
              ...message,
              content: message.content + event.data.content,
              createdAt: message.createdAt ?? new Date().toISOString(),
            }
          : message,
      ),
    };
  }
  if (event.type === "error") {
    return chatReducer(state, {
      type: "failed",
      code: isChatLimitErrorCode(event.data.code)
        ? event.data.code
        : undefined,
      message: event.data.message ?? "Unable to get a response.",
    });
  }
  return { ...state, isGenerating: false, activeAssistantId: undefined };
}
