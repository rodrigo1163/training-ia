import { Module } from '@nestjs/common';
import { WebsiteTextExtractor } from '@/domain/application/content/website-text-extractor';
import { DocumentExtractor } from '@/domain/application/content/document-extractor';
import { TextSplitter } from '@/domain/application/content/text-splitter';
import { CheerioWebsiteTextExtractor } from './cheerio-website-text-extractor';
import { LangchainTextSplitter } from './langchain-text-splitter';
import { LocalDocumentExtractor } from './local-document-extractor';
import { OpenRouterDocumentExtractor } from './openrouter-document-extractor';
import { EnvModule } from '@/infra/env/env.module';

@Module({
  imports: [EnvModule],
  providers: [
    CheerioWebsiteTextExtractor,
    LocalDocumentExtractor,
    OpenRouterDocumentExtractor,
    LangchainTextSplitter,
    {
      provide: WebsiteTextExtractor,
      useExisting: CheerioWebsiteTextExtractor,
    },
    {
      provide: DocumentExtractor,
      useExisting: LocalDocumentExtractor,
    },
    {
      provide: TextSplitter,
      useExisting: LangchainTextSplitter,
    },
  ],
  exports: [WebsiteTextExtractor, DocumentExtractor, TextSplitter],
})
export class ContentModule { }
