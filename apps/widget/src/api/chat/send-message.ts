import { isChatLimitErrorCode } from "../../helpers/chat-errors.ts";
import { parseSseStream } from "../../helpers/sse-parser.ts";
import type { ChatEvent, SendMessageInput } from "../../types/chat.ts";
import type { ChatLimitErrorCode } from "@training-ia/contracts";

export class ChatRequestError extends Error {
  readonly status: number;
  readonly code?: ChatLimitErrorCode;

  constructor(
    status: number,
    message: string,
    code?: ChatLimitErrorCode,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function* sendMessage(
  input: SendMessageInput,
): AsyncIterable<ChatEvent> {
  const response = await fetch(
    `${input.apiUrl.replace(/\/$/, "")}/public/chat/${encodeURIComponent(input.deploymentKey)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: input.conversationId,
        clientMessageId: input.clientMessageId,
        content: input.content,
        context: input.context,
        displayedStarterQuestions: input.displayedStarterQuestions,
      }),
      signal: input.signal,
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Unable to send the message.";
    const code =
      isRecord(payload) && isChatLimitErrorCode(payload.code)
        ? payload.code
        : undefined;
    throw new ChatRequestError(
      response.status,
      message,
      code,
    );
  }
  if (!response.body) {
    throw new ChatRequestError(502, "The server did not return a stream.");
  }

  for await (const event of parseSseStream(response.body)) {
    if (![
      "metadata",
      "delta",
      "completed",
      "error",
    ].includes(event.event)) {
      continue;
    }
    const data = JSON.parse(event.data) as ChatEvent["data"];
    yield { type: event.event, data } as ChatEvent;
  }
}
