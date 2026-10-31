import { env } from "@/env";

import type { Bot, BotResponse } from "./types";

export async function removeAvatar(
  orgSlug: string,
  botSlug: string,
): Promise<Bot> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/avatar`,
    { credentials: "include", method: "DELETE" },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Unable to remove the avatar.");
  }

  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");
  return payload.bot;
}
