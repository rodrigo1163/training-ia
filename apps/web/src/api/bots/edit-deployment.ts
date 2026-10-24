import { env } from "@/env";

import type {
  BotDeployment,
  DeploymentResponse,
  EditDeploymentInput,
} from "./types";

export async function editDeployment(
  orgSlug: string,
  botSlug: string,
  input: EditDeploymentInput,
): Promise<BotDeployment | null> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/deployment`,
    {
      body: JSON.stringify(input),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );

  if (!response.ok) throw new Error("Unable to save the bot deployment.");

  const payload = (await response.json()) as DeploymentResponse;
  return payload.deployment;
}
