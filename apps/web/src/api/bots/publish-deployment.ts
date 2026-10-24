import { env } from "@/env";

import type { BotDeployment, DeploymentResponse } from "./types";

export async function publishDeployment(
  orgSlug: string,
  botSlug: string,
  allowedOrigins: string[],
): Promise<BotDeployment | null> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/deployment`,
    {
      body: JSON.stringify({ allowedOrigins }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) throw new Error("Unable to save the bot deployment.");

  const payload = (await response.json()) as DeploymentResponse;
  return payload.deployment;
}
