import { Module } from '@nestjs/common';
import { EnvModule } from '@/infra/env/env.module';
import { DocumentProcessingPublisher } from '@/infra/messaging/document-processing-publisher';
import { OnDocumentProcessingRequested } from './on-document-processing-requested.js';

@Module({
  imports: [EnvModule],
  providers: [
    DocumentProcessingPublisher,
    OnDocumentProcessingRequested,
  ],
})
export class EventsModule {}
