import type { ChatConfig } from "../../types/chat";

export async function fetchChatConfig(
  apiUrl: string,
  deploymentKey: string,
): Promise<ChatConfig> {
  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/public/chat/${encodeURIComponent(deploymentKey)}/config`,
    { cache: "no-store" },
  );

  if (!response.ok) throw new Error("Unable to load the chat configuration.");

  const payload = (await response.json()) as { config?: ChatConfig };
  if (!payload.config) {
    throw new Error("The backend returned an invalid chat configuration.");
  }

  return payload.config;
}
