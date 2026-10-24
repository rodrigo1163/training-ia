import { env } from "@/env";

import type { BotDeployment, DeploymentResponse } from "./types";

export async function fetchDeployment(
  orgSlug: string,
  botSlug: string,
): Promise<BotDeployment | null> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/deployment`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Unable to save the bot deployment.");

  const payload = (await response.json()) as DeploymentResponse;
  return payload.deployment;
}
