import { env } from "@/env";

export async function updateDataContent(
  orgSlug: string,
  botSlug: string,
  documentId: string,
  markdown: string,
): Promise<void> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/data/${encodeURIComponent(documentId)}`,
    {
      body: JSON.stringify({ markdown }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );

  if (!response.ok) throw new Error("Unable to update the document text.");
}
