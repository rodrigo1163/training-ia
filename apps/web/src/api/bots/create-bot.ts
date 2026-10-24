import { env } from "@/env";

import type { Bot, BotResponse } from "./types";

export async function createBot(orgSlug: string, name: string): Promise<Bot> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots`,
    {
      body: JSON.stringify({ name }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "A bot with this name already exists."
        : "Unable to create the bot.",
    );
  }

  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");

  return payload.bot;
}
