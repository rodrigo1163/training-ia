import { open, readFile } from 'node:fs/promises'

import { extractText } from 'unpdf'

import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { IngestionError } from '../../lib/errors/ingestion-error.js'

const PDF_SIGNATURE = Buffer.from('%PDF-')

export type ExtractedPage = {
  pageNumber: number
  text: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function assertPdfSignature(filePath: string) {
  const handle = await open(filePath, 'r')

  try {
    const header = Buffer.alloc(PDF_SIGNATURE.byteLength)
    const { bytesRead } = await handle.read(
      header,
      0,
      PDF_SIGNATURE.byteLength,
      0,
    )

    if (
      bytesRead < PDF_SIGNATURE.byteLength ||
      !header.equals(PDF_SIGNATURE)
    ) {
      throw new IngestionError('INVALID_PDF_SIGNATURE')
    }
  } finally {
    await handle.close()
  }
}

export async function extractPages(filePath: string): Promise<ExtractedPage[]> {
  await assertPdfSignature(filePath)

  const buffer = await readFile(filePath)
  const data = new Uint8Array(buffer)
  const result = await extractText(data, { mergePages: false })
  const pages = Array.isArray(result.text) ? result.text : [result.text]

  if (pages.length > INGESTION_CONFIG.maxPages) {
    throw new IngestionError('PDF_TOO_MANY_PAGES')
  }

  const extracted: ExtractedPage[] = []
  let totalCharacters = 0

  for (let index = 0; index < pages.length; index += 1) {
    const text = normalizeText(pages[index] ?? '')
    if (!text) {
      continue
    }

    totalCharacters += text.length
    if (totalCharacters > INGESTION_CONFIG.maxExtractedCharacters) {
      throw new IngestionError('PDF_TOO_MUCH_TEXT')
    }

    extracted.push({
      pageNumber: index + 1,
      text,
    })
  }

  if (extracted.length === 0) {
    throw new IngestionError('PDF_WITHOUT_TEXT')
  }

  return extracted
}
