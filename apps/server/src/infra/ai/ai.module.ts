import { Module } from '@nestjs/common';
import { EmbeddingGenerator } from '@/domain/application/ai/embedding-generator';
import { ChatModel } from '@/domain/application/ai/chat-model';
import { KnowledgeRetriever } from '@/domain/application/ai/knowledge-retriever';
import { EnvModule } from '@/infra/env/env.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { OpenRouterChatModel } from './openrouter-chat-model.js';
import { OpenRouterEmbeddingGenerator } from './openrouter-embedding-generator.js';
import { PrismaKnowledgeRetriever } from './prisma-knowledge-retriever.js';

@Module({
  imports: [EnvModule, DatabaseModule],
  providers: [
    OpenRouterEmbeddingGenerator,
    PrismaKnowledgeRetriever,
    OpenRouterChatModel,
    {
      provide: EmbeddingGenerator,
      useExisting: OpenRouterEmbeddingGenerator,
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
  exports: [EmbeddingGenerator, KnowledgeRetriever, ChatModel],
})
export class AiModule {}
