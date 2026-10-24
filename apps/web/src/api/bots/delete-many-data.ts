import { env } from "@/env";

export async function deleteManyData(
  orgSlug: string,
  botSlug: string,
  documentIds: string[],
): Promise<void> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data`,
    {
      body: JSON.stringify({ documentIds }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to delete the selected documents.");
  }
}
