export const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";

const avatarMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function validateAvatarFile(file: File): Promise<void> {
  if (!avatarMimeTypes.has(file.type)) {
    throw new Error("Use a PNG, JPG, JPEG, or WebP image.");
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    throw new Error("Avatar files must be at most 2 MB.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error("The avatar dimensions are invalid.");
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
