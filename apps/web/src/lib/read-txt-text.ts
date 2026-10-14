export type TxtTextReadProgress = (progress: number) => void;

export async function readTxtText(
  file: File,
  onProgress?: TxtTextReadProgress,
): Promise<string> {
  onProgress?.(0);
  const text = await file.text();
  onProgress?.(100);
  return text;
}
