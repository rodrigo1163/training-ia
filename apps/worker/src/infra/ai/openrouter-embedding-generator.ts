import { Injectable } from '@nestjs/common'
import { OpenAIEmbeddings } from '@langchain/openai'

import { EmbeddingGenerator } from '../../domain/application/ai/embedding-generator.js'
import { EnvService } from '../env/env.service.js'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const EMBEDDING_BATCH_SIZE = 50

@Injectable()
export class OpenRouterEmbeddingGenerator implements EmbeddingGenerator {
  readonly model = 'openai/text-embedding-3-small'
  readonly dimensions = 1536
  private readonly embeddings: OpenAIEmbeddings

  constructor(envService: EnvService) {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: envService.get('OPENROUTER_API_KEY'),
      model: this.model,
      dimensions: this.dimensions,
      batchSize: EMBEDDING_BATCH_SIZE,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
      },
    })
  }

  embedDocuments(documents: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(documents)
  }
}
