import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingGenerator } from '@/domain/application/services/embedding-generator';
import { EnvService } from '@/infra/env/env.service';

export const OPENROUTER_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
export const OPENROUTER_EMBEDDING_DIMENSIONS = 1536;

@Injectable()
export class OpenRouterEmbeddingGenerator implements EmbeddingGenerator {
  private readonly embeddings: OpenAIEmbeddings;

  constructor(env: EnvService) {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: env.get('OPENROUTER_API_KEY'),
      model: OPENROUTER_EMBEDDING_MODEL,
      dimensions: OPENROUTER_EMBEDDING_DIMENSIONS,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
    });
  }

  embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
}
