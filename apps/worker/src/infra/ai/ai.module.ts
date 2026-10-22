import { Module } from '@nestjs/common'

import { EmbeddingGenerator } from '../../domain/application/ai/embedding-generator.js'
import { EnvModule } from '../env/env.module.js'
import { OpenRouterEmbeddingGenerator } from './openrouter-embedding-generator.js'

@Module({
  imports: [EnvModule],
  providers: [
    OpenRouterEmbeddingGenerator,
    {
      provide: EmbeddingGenerator,
      useExisting: OpenRouterEmbeddingGenerator,
    },
  ],
  exports: [EmbeddingGenerator],
})
export class AiModule {}
