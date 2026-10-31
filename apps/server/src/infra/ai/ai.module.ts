import { Module } from '@nestjs/common';
import { EmbeddingGenerator } from '@/domain/application/ai/embedding-generator';
import { DocumentEmbeddingGenerator } from '@/domain/application/ai/document-embedding-generator';
import { ChatModelFactory } from '@/domain/application/ai/chat-model';
import { KnowledgeRetriever } from '@/domain/application/ai/knowledge-retriever';
import { EnvModule } from '@/infra/env/env.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { OpenRouterChatModelFactory } from './openrouter-chat-model';
import { OpenRouterEmbeddingGenerator } from './openrouter-embedding-generator';
import { OpenRouterDocumentEmbeddingGenerator } from './openrouter-document-embedding-generator';
import { PrismaKnowledgeRetriever } from './prisma-knowledge-retriever';

@Module({
  imports: [EnvModule, DatabaseModule],
  providers: [
    OpenRouterEmbeddingGenerator,
    OpenRouterDocumentEmbeddingGenerator,
    PrismaKnowledgeRetriever,
    OpenRouterChatModelFactory,
    {
      provide: EmbeddingGenerator,
      useExisting: OpenRouterEmbeddingGenerator,
    },
    {
      provide: DocumentEmbeddingGenerator,
      useExisting: OpenRouterDocumentEmbeddingGenerator,
    },
    {
      provide: KnowledgeRetriever,
      useExisting: PrismaKnowledgeRetriever,
    },
    {
      provide: ChatModelFactory,
      useExisting: OpenRouterChatModelFactory,
    },
  ],
  exports: [
    EmbeddingGenerator,
    DocumentEmbeddingGenerator,
    KnowledgeRetriever,
    ChatModelFactory,
  ],
})
export class AiModule { }
