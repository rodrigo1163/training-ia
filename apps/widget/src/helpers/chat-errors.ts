import {
  CHAT_LIMIT_ERROR_CODES,
  type ChatLimitErrorCode,
} from "@training-ia/contracts";

export { CHAT_LIMIT_ERROR_CODES };

export const CHAT_LIMIT_ERROR_MESSAGES: Record<
  ChatLimitErrorCode,
  string
> = {
  [CHAT_LIMIT_ERROR_CODES.daily]:
    "Este bot atingiu o limite diário de mensagens. Tente novamente amanhã.",
  [CHAT_LIMIT_ERROR_CODES.conversation]:
    "Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar.",
};

export function isChatLimitErrorCode(
  value: unknown,
): value is ChatLimitErrorCode {
  return Object.values(CHAT_LIMIT_ERROR_CODES).includes(
    value as ChatLimitErrorCode,
  );
}

export function getChatErrorMessage(
  code: ChatLimitErrorCode | undefined,
  fallback: string,
) {
  return code ? CHAT_LIMIT_ERROR_MESSAGES[code] : fallback;
}
