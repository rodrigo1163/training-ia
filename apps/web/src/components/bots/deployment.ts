import { env } from "@/env";

const API_URL = env.VITE_API_URL;

export type BotDeployment = {
  id: string;
  publicKey: string;
  status: "ACTIVE" | "INACTIVE";
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string | null;
};

type DeploymentResponse = { deployment: BotDeployment | null };

export const deploymentQueryKey = (orgSlug: string, botSlug: string) =>
  ["bot-deployment", orgSlug, botSlug] as const;

function deploymentUrl(orgSlug: string, botSlug: string) {
  return `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/deployment`;
}

async function parseDeployment(response: Response): Promise<BotDeployment | null> {
  if (!response.ok) throw new Error("Unable to save the bot deployment.");
  const payload = (await response.json()) as DeploymentResponse;
  return payload.deployment;
}

export async function fetchDeployment(orgSlug: string, botSlug: string) {
  return parseDeployment(await fetch(deploymentUrl(orgSlug, botSlug), { credentials: "include" }));
}

export async function publishDeployment(orgSlug: string, botSlug: string, allowedOrigins: string[]) {
  return parseDeployment(await fetch(deploymentUrl(orgSlug, botSlug), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allowedOrigins }),
  }));
}

export async function editDeployment(orgSlug: string, botSlug: string, input: { allowedOrigins?: string[]; status?: "ACTIVE" | "INACTIVE" }) {
  return parseDeployment(await fetch(deploymentUrl(orgSlug, botSlug), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}
