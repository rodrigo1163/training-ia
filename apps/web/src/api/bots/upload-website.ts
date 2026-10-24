import { env } from "@/env";

import type { UploadFileResponse } from "./types";

export async function uploadWebsite(
  orgSlug: string,
  botSlug: string,
  url: string,
): Promise<void> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-website-bot`,
    {
      body: JSON.stringify({ url }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to extract the website content.");
  }

  const payload = (await response.json()) as UploadFileResponse;
  if (!payload.documentId) {
    throw new Error("The backend did not confirm the website extraction.");
  }
}
