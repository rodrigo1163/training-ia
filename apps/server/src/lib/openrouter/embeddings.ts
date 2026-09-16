import { z } from 'zod'

import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { env } from '../../env.js'

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
      index: z.number().int().optional(),
    }),
  ),
  model: z.string().optional(),
})

export type EmbeddingInputType = 'search_document' | 'search_query'

async function createEmbeddings(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const response = await fetch(`${env.OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.OPENROUTER_APP_URL,
      'X-Title': env.OPENROUTER_APP_NAME,
    },
    body: JSON.stringify({
      model: env.OPENROUTER_EMBEDDING_MODEL,
      input: texts,
      dimensions: env.OPENROUTER_EMBEDDING_DIMENSIONS,
      input_type: inputType,
      encoding_format: 'float',
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `OPENROUTER_EMBEDDING_FAILED:${response.status}:${body.slice(0, 200)}`,
    )
  }

  const json: unknown = await response.json()
  const parsed = embeddingResponseSchema.parse(json)

  if (parsed.data.length !== texts.length) {
    throw new Error('OPENROUTER_EMBEDDING_COUNT_MISMATCH')
  }

  const ordered = [...parsed.data].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  )

  return ordered.map((item) => {
    if (item.embedding.length !== env.OPENROUTER_EMBEDDING_DIMENSIONS) {
      throw new Error('OPENROUTER_EMBEDDING_DIMENSION_MISMATCH')
    }

    if (item.embedding.some((value) => !Number.isFinite(value))) {
      throw new Error('OPENROUTER_EMBEDDING_NON_FINITE')
    }

    return item.embedding
  })
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = []
  const batchSize = INGESTION_CONFIG.embeddingBatchSize

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize)
    const batchVectors = await createEmbeddings(batch, 'search_document')
    vectors.push(...batchVectors)
  }

  return vectors
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await createEmbeddings([text], 'search_query')
  return vector
}
