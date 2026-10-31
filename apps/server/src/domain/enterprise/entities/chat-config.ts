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
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  maxMessagesPerDay: number | null;
  maxUserMessagesPerConversation: number | null;
}

export type ChatConfigPatch = Partial<ChatConfig>;

export function createDefaultChatConfig(): ChatConfig {
  return {
    avatarUrl: null,
    inputPlaceholder: null,
    submitButtonText: null,
    showMessageTimestamps: false,
    starterQuestions: [],
    generateStarterQuestionsAfterResponse: false,
    initialMessage: null,
    headerStatusText: null,
    chatBackgroundColor: null,
    headerFooterBackgroundColor: null,
    assistantMessageBackgroundColor: null,
    userMessageBackgroundColor: null,
    model: null,
    temperature: null,
    maxTokens: null,
    maxMessagesPerDay: null,
    maxUserMessagesPerConversation: null,
  };
}

const nullableTextFields = [
  'avatarUrl',
  'inputPlaceholder',
  'submitButtonText',
  'initialMessage',
  'headerStatusText',
  'chatBackgroundColor',
  'headerFooterBackgroundColor',
  'assistantMessageBackgroundColor',
  'userMessageBackgroundColor',
  'model',
] as const;

export function normalizeChatConfigPatch(
  patch: ChatConfigPatch,
): ChatConfigPatch {
  const normalized = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as ChatConfigPatch;

  for (const field of nullableTextFields) {
    const value = normalized[field];

    if (typeof value === 'string') {
      normalized[field] = value.trim() === '' ? null : value.trim();
    }
  }

  if (normalized.starterQuestions) {
    normalized.starterQuestions = normalized.starterQuestions.map((question) =>
      question.trim(),
    );
  }

  return normalized;
}
