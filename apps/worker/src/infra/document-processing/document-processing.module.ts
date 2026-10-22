import { Module } from '@nestjs/common'

import { ProcessDocumentUseCase } from '../../domain/application/use-cases/process-document.js'
import { AiModule } from '../ai/ai.module.js'
import { ContentModule } from '../content/content.module.js'
import { DatabaseModule } from '../database/database.module.js'
import { MessagingModule } from '../messaging/messaging.module.js'
import { StorageModule } from '../storage/storage.module.js'
import { ProcessDocumentConsumer } from '../messaging/process-document.consumer.js'

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
