import { env } from "@/env";

import type { UploadFileResponse } from "./types";

function getResponseError(responseText: string, fallbackMessage: string) {
  try {
    const payload = JSON.parse(responseText) as {
      error?: unknown;
      message?: unknown;
    };

    if (typeof payload.message === "string") return payload.message;
    if (
      Array.isArray(payload.message) &&
      payload.message.every(
        (message): message is string => typeof message === "string",
      )
    ) {
      return payload.message.join(", ");
    }
    if (typeof payload.error === "string") return payload.error;
  } catch {
    // Use the operation-specific fallback when the response is not JSON.
  }

  return fallbackMessage;
}

export async function uploadFile(
  orgSlug: string,
  botSlug: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const fallbackMessage = `Unable to upload "${file.name}".`;

    request.open(
      "POST",
      `${env.VITE_API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-file`,
    );
    request.withCredentials = true;

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("error", () => reject(new Error(fallbackMessage)));
    request.addEventListener("abort", () =>
      reject(new Error(`Upload of "${file.name}" was canceled.`)),
    );
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(
          new Error(getResponseError(request.responseText, fallbackMessage)),
        );
        return;
      }

      let payload: UploadFileResponse;
      try {
        payload = JSON.parse(request.responseText) as UploadFileResponse;
      } catch {
        reject(new Error(`The backend did not confirm "${file.name}" upload.`));
        return;
      }
      if (!payload.documentId) {
        reject(new Error(`The backend did not confirm "${file.name}" upload.`));
        return;
      }

      onProgress?.(100);
      resolve();
    });
    request.send(formData);
  });
}
