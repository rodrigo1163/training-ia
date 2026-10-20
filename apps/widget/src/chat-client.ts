import { parseSseStream } from './sse-parser';

export type ChatEvent =
  | { type: 'metadata'; data: { conversationId: string; userMessageId: string; assistantMessageId: string } }
  | { type: 'delta'; data: { content: string } }
  | { type: 'completed'; data: { model: string; inputTokens?: number; outputTokens?: number } }
  | { type: 'error'; data: { code: string; message: string } };

export class ChatRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function* sendMessage(input: {
  apiUrl: string;
  deploymentKey: string;
  conversationId?: string;
  clientMessageId: string;
  content: string;
  context?: { pageUrl?: string; pageTitle?: string; locale?: string };
  signal: AbortSignal;
}): AsyncIterable<ChatEvent> {
  const response = await fetch(`${input.apiUrl.replace(/\/$/, '')}/public/chat/${encodeURIComponent(input.deploymentKey)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: input.conversationId,
      clientMessageId: input.clientMessageId,
      content: input.content,
      context: input.context,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new ChatRequestError(response.status, payload?.message ?? 'Não foi possível enviar a mensagem.');
  }
  if (!response.body) throw new ChatRequestError(502, 'O servidor não retornou um stream.');

  for await (const event of parseSseStream(response.body)) {
    if (!['metadata', 'delta', 'completed', 'error'].includes(event.event)) continue;
    const data = JSON.parse(event.data) as ChatEvent['data'];
    yield { type: event.event, data } as ChatEvent;
  }
}
