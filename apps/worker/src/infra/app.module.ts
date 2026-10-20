import { Module } from '@nestjs/common'
import { R2Storage } from '@training-ia/storage'

import { DocumentProcessingRepository } from '../domain/application/repositories/document-processing-repository.js'
import { DocumentExtractor } from '../domain/application/services/document-extractor.js'
import { DocumentStatusPublisher } from '../domain/application/services/document-status-publisher.js'
import { DocumentStorage } from '../domain/application/services/document-storage.js'
import { EmbeddingGenerator } from '../domain/application/services/embedding-generator.js'
import { TextSplitter } from '../domain/application/services/text-splitter.js'
import { ProcessDocumentUseCase } from '../domain/application/use-cases/process-document.js'
import { OpenRouterEmbeddingGenerator } from './ai/openrouter-embedding-generator.js'
import { RabbitMqConnection } from './connections/rabbitmq.connection.js'
import { RedisConnection } from './connections/redis.connection.js'
import { LangchainTextSplitter } from './content/langchain-text-splitter.js'
import { UnpdfDocumentExtractor } from './content/unpdf-document-extractor.js'
import { DatabaseModule } from './database/database.module.js'
import { PrismaDocumentProcessingRepository } from './database/prisma/repositories/prisma-document-processing-repository.js'
import { EnvModule } from './env/env.module.js'
import { EnvService } from './env/env.service.js'
import { ProcessDocumentConsumer } from './messaging/process-document.consumer.js'
import { RedisDocumentStatusPublisher } from './messaging/redis-document-status-publisher.js'

@Module({
  imports: [EnvModule, DatabaseModule],
  providers: [
    ProcessDocumentUseCase,
    ProcessDocumentConsumer,
    RabbitMqConnection,
    RedisConnection,
    PrismaDocumentProcessingRepository,
    UnpdfDocumentExtractor,
    OpenRouterEmbeddingGenerator,
    LangchainTextSplitter,
    RedisDocumentStatusPublisher,
    {
      provide: DocumentProcessingRepository,
      useExisting: PrismaDocumentProcessingRepository,
    },
    {
      provide: DocumentExtractor,
      useExisting: UnpdfDocumentExtractor,
    },
    {
      provide: DocumentStorage,
      inject: [EnvService],
      useFactory: (envService: EnvService) =>
        new R2Storage({
          accountId: envService.get('CLOUDFLARE_ACCOUNT_ID'),
          bucket: envService.get('AWS_BUCKET_NAME'),
          accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
        }),
    },
    {
      provide: EmbeddingGenerator,
      useExisting: OpenRouterEmbeddingGenerator,
    },
    {
      provide: TextSplitter,
      useExisting: LangchainTextSplitter,
    },
    {
      provide: DocumentStatusPublisher,
      useExisting: RedisDocumentStatusPublisher,
    },
  ],
})
export class AppModule {}
