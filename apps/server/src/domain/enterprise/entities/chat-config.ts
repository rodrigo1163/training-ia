export interface ChatConfig {
  avatarUrl: string | null;
  avatarStorageKey: string | null;
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

const nullableTextMaxLengths = {
  inputPlaceholder: 120,
  submitButtonText: 40,
  initialMessage: 2000,
  headerStatusText: 120,
  model: 200,
} as const;

const colorFields = [
  'chatBackgroundColor',
  'headerFooterBackgroundColor',
  'assistantMessageBackgroundColor',
  'userMessageBackgroundColor',
] as const;

const colorPattern =
  /^(?:#[\da-f]{3,4}|#[\da-f]{6}(?:[\da-f]{2})?|rgba?\(\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\)|hsla?\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\))$/i;

export function isAvatarStorageKey(value: string): boolean {
  return /^chat-avatars\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/.test(
    value,
  );
}

export class InvalidChatConfigError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function validateNullableText(
  field: string,
  value: unknown,
  maxLength: number,
): InvalidChatConfigError | null {
  if (value !== null && typeof value !== 'string') {
    return new InvalidChatConfigError(`${field} must be a string or null.`);
  }

  if (typeof value === 'string' && value.length > maxLength) {
    return new InvalidChatConfigError(
      `${field} must be at most ${maxLength} characters.`,
    );
  }

  return null;
}

function validateNullableNumber(
  field: string,
  value: unknown,
  options: { integer?: boolean; min: number; max: number },
): InvalidChatConfigError | null {
  if (value === null) return null;

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (options.integer && !Number.isInteger(value)) ||
    value < options.min ||
    value > options.max
  ) {
    const integerMessage = options.integer ? ' an integer' : '';
    return new InvalidChatConfigError(
      `${field} must be${integerMessage} between ${options.min} and ${options.max}.`,
    );
  }

  return null;
}

export function validateChatConfig(
  config: ChatConfig,
): InvalidChatConfigError | null {
  if (
    config.avatarStorageKey !== null &&
    !isAvatarStorageKey(config.avatarStorageKey)
  ) {
    return new InvalidChatConfigError('avatarStorageKey is invalid.');
  }

  if (config.avatarUrl !== null) {
    const error = validateNullableText('avatarUrl', config.avatarUrl, 2000);
    if (error) return error;

    try {
      new URL(config.avatarUrl);
    } catch {
      return new InvalidChatConfigError('avatarUrl must be a valid URL.');
    }
  }

  for (const [field, maxLength] of Object.entries(nullableTextMaxLengths)) {
    const error = validateNullableText(
      field,
      config[field as keyof typeof nullableTextMaxLengths],
      maxLength,
    );
    if (error) return error;
  }

  for (const field of colorFields) {
    const value = config[field];

    if (
      value !== null &&
      (typeof value !== 'string' || !colorPattern.test(value))
    ) {
      return new InvalidChatConfigError(`${field} must be a valid CSS color.`);
    }
  }

  if (typeof config.showMessageTimestamps !== 'boolean') {
    return new InvalidChatConfigError(
      'showMessageTimestamps must be a boolean.',
    );
  }

  if (typeof config.generateStarterQuestionsAfterResponse !== 'boolean') {
    return new InvalidChatConfigError(
      'generateStarterQuestionsAfterResponse must be a boolean.',
    );
  }

  if (
    !Array.isArray(config.starterQuestions) ||
    config.starterQuestions.length > 3
  ) {
    return new InvalidChatConfigError(
      'Starter questions must contain at most three items.',
    );
  }

  const normalizedQuestions: string[] = [];
  for (const question of config.starterQuestions) {
    if (typeof question !== 'string' || question.trim().length === 0) {
      return new InvalidChatConfigError('Starter questions must not be empty.');
    }

    if (question.trim().length > 120) {
      return new InvalidChatConfigError(
        'Starter questions must be at most 120 characters.',
      );
    }

    normalizedQuestions.push(
      question.toLocaleLowerCase().replace(/\s+/g, ' ').trim(),
    );
  }

  if (new Set(normalizedQuestions).size !== normalizedQuestions.length) {
    return new InvalidChatConfigError('Starter questions must be unique.');
  }

  const temperatureError = validateNullableNumber(
    'temperature',
    config.temperature,
    {
      min: 0,
      max: 2,
    },
  );
  if (temperatureError) return temperatureError;

  const maxTokensError = validateNullableNumber('maxTokens', config.maxTokens, {
    integer: true,
    min: 1,
    max: 200_000,
  });
  if (maxTokensError) return maxTokensError;

  const maxMessagesPerDayError = validateNullableNumber(
    'maxMessagesPerDay',
    config.maxMessagesPerDay,
    {
      integer: true,
      min: 1,
      max: 1_000_000,
    },
  );
  if (maxMessagesPerDayError) return maxMessagesPerDayError;

  return validateNullableNumber(
    'maxUserMessagesPerConversation',
    config.maxUserMessagesPerConversation,
    {
      integer: true,
      min: 1,
      max: 1_000_000,
    },
  );
}

export function createDefaultChatConfig(): ChatConfig {
  return {
    avatarUrl: null,
    avatarStorageKey: null,
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
