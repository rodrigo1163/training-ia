import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { embedQuery } from '../../lib/openrouter/embeddings.js'
import {
  BotChunkRepository,
  type RetrievedChunk,
} from '../../repositories/bot-chunk.repository.js'
import { dedupeCitations, type ChatCitation } from './prompt.js'

export type RetrievalResult = {
  chunks: RetrievedChunk[]
  citations: ChatCitation[]
}

export class RetrievalService {
  constructor(private readonly chunks = new BotChunkRepository()) {}

  async retrieve(input: {
    organizationId: string
    botId: string
    question: string
  }): Promise<RetrievalResult> {
    const embedding = await embedQuery(input.question)
    const candidates = await this.chunks.searchSimilar({
      organizationId: input.organizationId,
      botId: input.botId,
      embedding,
    })

    const selected: RetrievedChunk[] = []
    let totalCharacters = 0

    for (const chunk of candidates) {
      if (totalCharacters + chunk.content.length > INGESTION_CONFIG.maxContextCharacters) {
        break
      }
      selected.push(chunk)
      totalCharacters += chunk.content.length
    }

    return {
      chunks: selected,
      citations: dedupeCitations(selected),
    }
  }
}
