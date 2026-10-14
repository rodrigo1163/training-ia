import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from '@/infra/auth/auth';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { AppController } from '@/infra/http/controllers/app.controller';
import { HealthController } from '@/infra/http/controllers/health.controller';
import { UploadPdfBotController } from '@/infra/http/controllers/upload-pdf-bot.controller';
import { UploadPdfsBotController } from '@/infra/http/controllers/upload-pdfs-bot.controller';
import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import { UploadBotPdfsUseCase } from '@/domain/application/use-cases/upload-bot-pdfs';
import { UploadTxtBotController } from '@/infra/http/controllers/upload-txt-bot.controller';
import { UploadTxtsBotController } from '@/infra/http/controllers/upload-txts-bot.controller';
import { UploadBotTxtUseCase } from '@/domain/application/use-cases/upload-bot-txt';
import { UploadBotTxtsUseCase } from '@/domain/application/use-cases/upload-bot-txts';
import { DocumentRepository } from '@/domain/application/repositories/document-repository';
import { PrismaDocumentRepository } from '@/infra/database/prisma/repositories/prisma-document-repository';
import { StorageModule } from '@/infra/http/storage/storage.module';
import { FetchDataController } from '@/infra/http/controllers/fetch-data.controller';
import { GetDocumentDetailsController } from '@/infra/http/controllers/get-document-details.controller';
import { GetDataFileController } from '@/infra/http/controllers/get-data-file.controller';
import { UpdateDocumentTextController } from '@/infra/http/controllers/update-document-text.controller';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { GetDocumentDetailsUseCase } from '@/domain/application/use-cases/get-document-details';
import { UpdateDocumentTextUseCase } from '@/domain/application/use-cases/update-document-text';
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
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { EventsModule } from '@/infra/events/events.module';
import { RedisConnection } from '@/infra/connections/redis.connection';
import { DocumentStatusEventHub } from '@/infra/messaging/document-status-events';
import { DocumentStatusEventsController } from '@/infra/http/controllers/document-status-events.controller';

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
    AppController,
    HealthController,
    UploadPdfBotController,
    UploadPdfsBotController,
    UploadTxtBotController,
    UploadTxtsBotController,
    FetchDataController,
    DocumentStatusEventsController,
    GetDocumentDetailsController,
    GetDataFileController,
    UpdateDocumentTextController,
    DeleteDataController,
    DeleteManyDataController,
    CreateBotController,
    FetchBotsController,
    GetBotController,
    DeleteBotController,
  ],
  providers: [
    UploadBotPdfUseCase,
    UploadBotPdfsUseCase,
    UploadBotTxtUseCase,
    UploadBotTxtsUseCase,
    FetchDataUseCase,
    GetDocumentDetailsUseCase,
    UpdateDocumentTextUseCase,
    DeleteDataUseCase,
    DeleteManyDataUseCase,
    CreateBotUseCase,
    FetchBotsUseCase,
    GetBotUseCase,
    DeleteBotUseCase,
    RedisConnection,
    DocumentStatusEventHub,
    PrismaDocumentRepository,
    PrismaBotRepository,
    PrismaOrganizationMemberRepository,
    PrismaOrganizationRepository,
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
    OrganizationGuard,
  ],
})
export class AppModule {}
