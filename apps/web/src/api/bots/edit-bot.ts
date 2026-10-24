import { env } from "@/env";

import type { Bot, BotResponse, EditBotInput } from "./types";

export async function editBot(
  orgSlug: string,
  botSlug: string,
  input: EditBotInput,
): Promise<Bot> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}`,
    {
      body: JSON.stringify(input),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );

  if (!response.ok) throw new Error("Unable to save the bot settings.");

  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");

  return payload.bot;
}
