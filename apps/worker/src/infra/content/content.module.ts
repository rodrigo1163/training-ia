import { Module } from '@nestjs/common'

import { DocumentExtractor } from '../../domain/application/content/document-extractor.js'
import { TextSplitter } from '../../domain/application/content/text-splitter.js'
import { EnvModule } from '../env/env.module.js'
import { LangchainTextSplitter } from './langchain-text-splitter.js'
import { OpenRouterDocumentExtractor } from './openrouter-document-extractor.js'

@Module({
  imports: [EnvModule],
  providers: [
    OpenRouterDocumentExtractor,
    LangchainTextSplitter,
    {
      provide: DocumentExtractor,
      useExisting: OpenRouterDocumentExtractor,
    },
    {
      provide: TextSplitter,
      useExisting: LangchainTextSplitter,
    },
  ],
  exports: [DocumentExtractor, TextSplitter],
})
export class ContentModule {}
