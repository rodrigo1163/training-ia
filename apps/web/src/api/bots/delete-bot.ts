import { env } from "@/env";

export async function deleteBot(
  orgSlug: string,
  botSlug: string,
): Promise<void> {
  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}`,
    { credentials: "include", method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "Remove the PDFs before deleting this bot."
        : "Unable to delete the bot.",
    );
  }
}
