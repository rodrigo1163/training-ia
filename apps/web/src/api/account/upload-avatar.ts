import { env } from "@/env";

export type UploadAvatarResponse = {
  imageUrl: string;
};

export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${env.VITE_API_URL}/account/avatar`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });

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

  return (await response.json()) as UploadAvatarResponse;
}
