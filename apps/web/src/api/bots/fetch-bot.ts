import { env } from "@/env";

import type { Bot, BotResponse } from "./types";

export async function fetchBot(
  orgSlug: string,
  botSlug: string,
): Promise<Bot> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Unable to load the bot.");

  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");

  return payload.bot;
}
