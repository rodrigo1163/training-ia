import { createHash } from 'node:crypto'

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { IngestionError } from '../../lib/errors/ingestion-error.js'
import type { ExtractedPage } from './extract-pages.js'

export type BuiltChunk = {
  chunkIndex: number
  content: string
  contentSha256: string
  pageNumber: number
  tokenCount: number
}

function approximateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export async function buildChunks(pages: ExtractedPage[]): Promise<BuiltChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: INGESTION_CONFIG.chunkSize,
    chunkOverlap: INGESTION_CONFIG.chunkOverlap,
  })

  const chunks: BuiltChunk[] = []

  for (const page of pages) {
    const parts = await splitter.splitText(page.text)

    for (const part of parts) {
      const content = part.trim()
      if (content.length < INGESTION_CONFIG.minChunkCharacters) {
        continue
      }

      chunks.push({
        chunkIndex: chunks.length,
        content,
        contentSha256: createHash('sha256').update(content).digest('hex'),
        pageNumber: page.pageNumber,
        tokenCount: approximateTokenCount(content),
      })
    }
  }

  if (chunks.length === 0) {
    throw new IngestionError('PDF_WITHOUT_TEXT')
  }

  if (chunks.length > INGESTION_CONFIG.maxChunksPerSource) {
    throw new IngestionError('TOO_MANY_CHUNKS')
  }

  return chunks
}
