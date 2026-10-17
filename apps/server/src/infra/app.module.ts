import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from '@/infra/auth/auth';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { UploadPdfBotController } from '@/infra/http/controllers/upload-pdf-bot.controller';
import { UploadPdfsBotController } from '@/infra/http/controllers/upload-pdfs-bot.controller';
import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import { UploadBotPdfsUseCase } from '@/domain/application/use-cases/upload-bot-pdfs';
import { UploadTxtBotController } from '@/infra/http/controllers/upload-txt-bot.controller';
import { UploadTxtsBotController } from '@/infra/http/controllers/upload-txts-bot.controller';
import { UploadBotTxtUseCase } from '@/domain/application/use-cases/upload-bot-txt';
import { UploadBotTxtsUseCase } from '@/domain/application/use-cases/upload-bot-txts';
import { UploadBotWebsiteController } from '@/infra/http/controllers/upload-bot-website.controller';
import { UploadBotWebsiteUseCase } from '@/domain/application/use-cases/upload-bot-website';
import { DocumentRepository } from '@/domain/application/repositories/document-repository';
import { PrismaDocumentRepository } from '@/infra/database/prisma/repositories/prisma-document-repository';
import { StorageModule } from '@/infra/http/storage/storage.module';
import { FetchDataController } from '@/infra/http/controllers/fetch-data.controller';
import { GetDocumentDetailsController } from '@/infra/http/controllers/get-document-details.controller';
import { GetDataFileController } from '@/infra/http/controllers/get-data-file.controller';
import { EditDocumentTextController } from '@/infra/http/controllers/edit-document-text.controller';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { GetDocumentDetailsUseCase } from '@/domain/application/use-cases/get-document-details';
import { EditDocumentTextUseCase } from '@/domain/application/use-cases/edit-document-text';
import { OrganizationMemberRepository } from '@/domain/application/repositories/organization-member-repository';
import { PrismaOrganizationMemberRepository } from '@/infra/database/prisma/repositories/prisma-organization-member-repository';
import { OrganizationRepository } from '@/domain/application/repositories/organization-repository';
import { PrismaOrganizationRepository } from '@/infra/database/prisma/repositories/prisma-organization-repository';
import { DeleteDataController } from '@/infra/http/controllers/delete-data.controller';
import { DeleteDataUseCase } from '@/domain/application/use-cases/delete-data';
import { DeleteManyDataController } from '@/infra/http/controllers/delete-many-data.controller';
import { DeleteManyDataUseCase } from '@/domain/application/use-cases/delete-many-data';
import { BotRepository } from '@/domain/application/repositories/bot-repository';
import { PrismaBotRepository } from '@/infra/database/prisma/repositories/prisma-bot-repository';
import { CreateBotController } from '@/infra/http/controllers/create-bot.controller';
import { DeleteBotController } from '@/infra/http/controllers/delete-bot.controller';
import { FetchBotsController } from '@/infra/http/controllers/fetch-bots.controller';
import { GetBotController } from '@/infra/http/controllers/get-bot.controller';
import { CreateBotUseCase } from '@/domain/application/use-cases/create-bot';
import { FetchBotsUseCase } from '@/domain/application/use-cases/fetch-bots';
import { GetBotUseCase } from '@/domain/application/use-cases/get-bot';
import { DeleteBotUseCase } from '@/domain/application/use-cases/delete-bot';
import { EditBotController } from '@/infra/http/controllers/edit-bot.controller';
import { EditBotUseCase } from '@/domain/application/use-cases/edit-bot';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { EventsModule } from '@/infra/events/events.module';
import { RedisConnection } from '@/infra/connections/redis.connection';
import { DocumentStatusEventHub } from '@/infra/messaging/document-status-events';
import { DocumentStatusEventsController } from '@/infra/http/controllers/document-status-events.controller';
import { WebsiteTextExtractor } from '@/domain/application/services/website-text-extractor';
import { CheerioWebsiteTextExtractor } from '@/infra/services/cheerio-website-text-extractor';
import { BotDeploymentController } from '@/infra/http/controllers/bot-deployment.controller';
import { SendBotMessageController } from '@/infra/http/controllers/send-bot-message.controller';
import { GetBotDeploymentUseCase } from '@/domain/application/use-cases/get-bot-deployment';
import { PublishBotDeploymentUseCase } from '@/domain/application/use-cases/publish-bot-deployment';
import { EditBotDeploymentUseCase } from '@/domain/application/use-cases/edit-bot-deployment';
import { SendBotMessageUseCase } from '@/domain/application/use-cases/send-bot-message';
import { BotDeploymentRepository } from '@/domain/application/repositories/bot-deployment-repository';
import { ChatRepository } from '@/domain/application/repositories/chat-repository';
import { PrismaBotDeploymentRepository } from '@/infra/database/prisma/repositories/prisma-bot-deployment-repository';
import { PrismaChatRepository } from '@/infra/database/prisma/repositories/prisma-chat-repository';
import { EmbeddingGenerator } from '@/domain/application/services/embedding-generator';
import { KnowledgeRetriever } from '@/domain/application/services/knowledge-retriever';
import { ChatModel } from '@/domain/application/services/chat-model';
import { OpenRouterEmbeddingGenerator } from '@/infra/ai/openrouter-embedding-generator';
import { PrismaKnowledgeRetriever } from '@/infra/ai/prisma-knowledge-retriever';
import { OpenRouterChatModel } from '@/infra/ai/openrouter-chat-model';

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    StorageModule,
    EventsModule,
    AuthModule.forRootAsync({
      imports: [EnvModule, DatabaseModule],
      inject: [EnvService, PrismaService],
      useFactory: (envService: EnvService, prismaService: PrismaService) => ({
        auth: createAuth(prismaService, {
          BETTER_AUTH_SECRET: envService.get('BETTER_AUTH_SECRET'),
          BETTER_AUTH_URL: envService.get('BETTER_AUTH_URL'),
          CLIENT_ORIGIN: envService.get('CLIENT_ORIGIN'),
        }),
      }),
    }),
  ],
  controllers: [
    UploadPdfBotController,
    UploadPdfsBotController,
    UploadTxtBotController,
    UploadTxtsBotController,
    UploadBotWebsiteController,
    FetchDataController,
    DocumentStatusEventsController,
    GetDocumentDetailsController,
    GetDataFileController,
    EditDocumentTextController,
    DeleteDataController,
    DeleteManyDataController,
    CreateBotController,
    FetchBotsController,
    GetBotController,
    DeleteBotController,
    EditBotController,
    BotDeploymentController,
    SendBotMessageController,
  ],
  providers: [
    UploadBotPdfUseCase,
    UploadBotPdfsUseCase,
    UploadBotTxtUseCase,
    UploadBotTxtsUseCase,
    UploadBotWebsiteUseCase,
    CheerioWebsiteTextExtractor,
    FetchDataUseCase,
    GetDocumentDetailsUseCase,
    EditDocumentTextUseCase,
    DeleteDataUseCase,
    DeleteManyDataUseCase,
    CreateBotUseCase,
    FetchBotsUseCase,
    GetBotUseCase,
    DeleteBotUseCase,
    EditBotUseCase,
    GetBotDeploymentUseCase,
    PublishBotDeploymentUseCase,
    EditBotDeploymentUseCase,
    SendBotMessageUseCase,
    RedisConnection,
    DocumentStatusEventHub,
    PrismaDocumentRepository,
    PrismaBotRepository,
    PrismaOrganizationMemberRepository,
    PrismaOrganizationRepository,
    PrismaBotDeploymentRepository,
    PrismaChatRepository,
    OpenRouterEmbeddingGenerator,
    PrismaKnowledgeRetriever,
    OpenRouterChatModel,
    {
      provide: BotRepository,
      useExisting: PrismaBotRepository,
    },
    {
      provide: DocumentRepository,
      useExisting: PrismaDocumentRepository,
    },
    {
      provide: OrganizationMemberRepository,
      useExisting: PrismaOrganizationMemberRepository,
    },
    {
      provide: OrganizationRepository,
      useExisting: PrismaOrganizationRepository,
    },
    {
      provide: WebsiteTextExtractor,
      useExisting: CheerioWebsiteTextExtractor,
    },
    {
      provide: BotDeploymentRepository,
      useExisting: PrismaBotDeploymentRepository,
    },
    {
      provide: ChatRepository,
      useExisting: PrismaChatRepository,
    },
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
    OrganizationGuard,
  ],
})
export class AppModule {}
