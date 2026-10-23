import { Module } from '@nestjs/common';

import { ProcessDocumentUseCase } from '@/domain/application/use-cases/process-document';
import { AiModule } from '@/infra/ai/ai.module';
import { ContentModule } from '@/infra/content/content.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { MessagingModule } from '@/infra/messaging/messaging.module';
import { ProcessDocumentConsumer } from '@/infra/messaging/rabbitmq/process-document.consumer';
import { StorageModule } from '@/infra/http/storage/storage.module';

@Module({
  imports: [
    DatabaseModule,
    AiModule,
    ContentModule,
    MessagingModule,
    StorageModule,
  ],
  providers: [ProcessDocumentUseCase, ProcessDocumentConsumer],
})
export class DocumentProcessingModule {}
