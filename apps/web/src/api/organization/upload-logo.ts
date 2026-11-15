import { env } from "@/env";

export type UploadOrganizationLogoResponse = {
  logoUrl: string;
};

export async function uploadOrganizationLogo(
  orgSlug: string,
  file: File,
): Promise<UploadOrganizationLogoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/logo`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    },
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

    throw new Error(message || "Unable to upload the organization logo.");
  }

  return (await response.json()) as UploadOrganizationLogoResponse;
}
