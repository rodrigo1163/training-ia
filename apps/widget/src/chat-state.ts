import type { ChatEvent } from './chat-client';

export interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
}

export interface ChatState {
  conversationId?: string;
  messages: WidgetMessage[];
  isGenerating: boolean;
  activeAssistantId?: string;
}

export type ChatAction =
  | { type: 'start'; userId: string; assistantId: string; content: string }
  | { type: 'event'; event: ChatEvent }
  | { type: 'failed'; message: string };

export const initialChatState: ChatState = {
  messages: [{ id: 'welcome', role: 'assistant', content: 'Olá! 👋 Como posso ajudar você hoje?' }],
  isGenerating: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  if (action.type === 'start') {
    return {
      ...state,
      isGenerating: true,
      activeAssistantId: action.assistantId,
      messages: [
        ...state.messages,
        { id: action.userId, role: 'user', content: action.content },
        { id: action.assistantId, role: 'assistant', content: '' },
      ],
    };
  }
  if (action.type === 'failed') {
    return {
      ...state,
      isGenerating: false,
      activeAssistantId: undefined,
      messages: state.messages.map((message) => message.id === state.activeAssistantId
        ? { ...message, content: message.content || action.message, failed: true }
        : message),
    };
  }
  const event = action.event;
  if (event.type === 'metadata') return { ...state, conversationId: event.data.conversationId };
  if (event.type === 'delta') {
    return {
      ...state,
      messages: state.messages.map((message) => message.id === state.activeAssistantId
        ? { ...message, content: message.content + event.data.content }
        : message),
    };
  }
  if (event.type === 'error') return chatReducer(state, { type: 'failed', message: event.data.message });
  return { ...state, isGenerating: false, activeAssistantId: undefined };
}
