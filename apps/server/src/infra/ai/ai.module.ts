import { Module } from '@nestjs/common';
import { EmbeddingGenerator } from '@/domain/application/ai/embedding-generator';
import { DocumentEmbeddingGenerator } from '@/domain/application/ai/document-embedding-generator';
import { ChatModel } from '@/domain/application/ai/chat-model';
import { KnowledgeRetriever } from '@/domain/application/ai/knowledge-retriever';
import { EnvModule } from '@/infra/env/env.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { OpenRouterChatModel } from './openrouter-chat-model';
import { OpenRouterEmbeddingGenerator } from './openrouter-embedding-generator';
import { OpenRouterDocumentEmbeddingGenerator } from './openrouter-document-embedding-generator';
import { PrismaKnowledgeRetriever } from './prisma-knowledge-retriever';

@Module({
  imports: [EnvModule, DatabaseModule],
  providers: [
    OpenRouterEmbeddingGenerator,
    OpenRouterDocumentEmbeddingGenerator,
    PrismaKnowledgeRetriever,
    OpenRouterChatModel,
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
      provide: ChatModel,
      useExisting: OpenRouterChatModel,
    },
  ],
  exports: [
    EmbeddingGenerator,
    DocumentEmbeddingGenerator,
    KnowledgeRetriever,
    ChatModel,
  ],
})
export class AiModule { }
