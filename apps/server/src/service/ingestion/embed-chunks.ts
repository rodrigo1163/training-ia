import { IngestionError } from '../../lib/errors/ingestion-error.js'
import { embedDocuments } from '../../lib/openrouter/embeddings.js'
import type { BuiltChunk } from './build-chunks.js'

export type EmbeddedChunk = BuiltChunk & {
  embedding: number[]
}

export async function embedChunks(chunks: BuiltChunk[]): Promise<EmbeddedChunk[]> {
  try {
    const embeddings = await embedDocuments(chunks.map((chunk) => chunk.content))

    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }))
  } catch (error) {
    throw new IngestionError('OPENROUTER_EMBEDDING_FAILED', error)
  }
}
