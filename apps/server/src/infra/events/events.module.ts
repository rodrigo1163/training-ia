import { Module } from '@nestjs/common';
import { OnDocumentProcessingRequested } from '@/domain/application/subscribers/on-document-processing-requested';
import { MessagingModule } from '@/infra/messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  providers: [OnDocumentProcessingRequested],
})
export class EventsModule {}
