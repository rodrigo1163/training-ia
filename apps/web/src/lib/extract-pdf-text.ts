import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type PdfTextExtractionProgress = (progress: number) => void;

export async function extractPdfText(
  file: File,
  onProgress?: PdfTextExtractionProgress,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;

  const pages: string[] = [];

  onProgress?.(0);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = content.items
      .filter(
        (item): item is typeof item & { str: string } => "str" in item,
      )
      .map((item) => item.str)
      .join(" ");

    pages.push(text);
    onProgress?.(Math.round((pageNumber / pdf.numPages) * 100));
  }

  return pages.join("\n\n").replace(/\u0000/g, "");
}
