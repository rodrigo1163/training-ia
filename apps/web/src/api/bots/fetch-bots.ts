import { env } from "@/env";

import type { Bot, BotsResponse } from "./types";

export async function fetchBots(orgSlug: string): Promise<Bot[]> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Unable to load bots.");

  const payload = (await response.json()) as BotsResponse;
  if (!Array.isArray(payload.bots)) {
    throw new Error("The backend returned an invalid bot list.");
  }

  return payload.bots;
}
