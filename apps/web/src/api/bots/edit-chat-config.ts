import { env } from "@/env";

import type { Bot, ChatConfigPatch, ChatConfigResponse } from "./types";

export async function editChatConfig(
  orgSlug: string,
  botSlug: string,
  patch: ChatConfigPatch,
): Promise<Bot> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/chat-config`,
    {
      body: JSON.stringify(patch),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Unable to save the chat settings.");
  }

  const payload = (await response.json()) as ChatConfigResponse;
  if (!payload.bot) {
    throw new Error("The backend returned an invalid bot.");
  }

  return payload.bot;
}
