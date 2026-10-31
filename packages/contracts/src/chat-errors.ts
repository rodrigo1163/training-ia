export const CHAT_LIMIT_ERROR_CODES = {
  daily: 'chat_daily_limit_reached',
  conversation: 'chat_conversation_limit_reached',
} as const;

export type ChatLimitErrorCode =
  (typeof CHAT_LIMIT_ERROR_CODES)[keyof typeof CHAT_LIMIT_ERROR_CODES];
