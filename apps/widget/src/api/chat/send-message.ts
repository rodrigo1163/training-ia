import { parseSseStream } from "../../helpers/sse-parser";
import type { ChatEvent, SendMessageInput } from "../../types/chat";

export class ChatRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
      }),
      signal: input.signal,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new ChatRequestError(
      response.status,
      payload?.message ?? "Unable to send the message.",
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
