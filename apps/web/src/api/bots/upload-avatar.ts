import { env } from "@/env";

import type { Bot, BotResponse } from "./types";

export async function uploadAvatar(
  orgSlug: string,
  botSlug: string,
  file: File,
): Promise<Bot> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/avatar`,
    { body: formData, credentials: "include", method: "POST" },
  );

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText;

    try {
      const payload = JSON.parse(responseText) as { message?: string };
      message = payload.message ?? responseText;
    } catch {
      // Some NestJS errors, including an unmatched route, are plain text.
    }

    throw new Error(message || "Unable to upload the avatar.");
  }

  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");
  return payload.bot;
}
