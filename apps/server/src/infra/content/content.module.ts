import { Module } from '@nestjs/common';
import { WebsiteTextExtractor } from '@/domain/application/content/website-text-extractor';
import { CheerioWebsiteTextExtractor } from './cheerio-website-text-extractor.js';

@Module({
  providers: [
    CheerioWebsiteTextExtractor,
    {
      provide: WebsiteTextExtractor,
      useExisting: CheerioWebsiteTextExtractor,
    },
  ],
  exports: [WebsiteTextExtractor],
})
export class ContentModule {}
