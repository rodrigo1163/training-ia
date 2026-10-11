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
import { CreatePresignedBotPdfUploadUseCase } from '@/domain/application/use-cases/create-presigned-bot-pdf-upload';
import { DocumentRepository } from '@/domain/application/repositories/document-repository';
import { Uploader } from '@/domain/application/storage/uploader';
import { PrismaDocumentRepository } from '@/infra/database/prisma/repositories/prisma-document-repository';
import { R2DocumentStorage } from '@/infra/storage/r2-document-storage';
import { FetchDataController } from '@/infra/http/controllers/fetch-data.controller';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { OrganizationRepository } from '@/domain/application/repositories/organization-repository';
import { PrismaOrganizationRepository } from '@/infra/database/prisma/repositories/prisma-organization-repository';
import { DeleteDataController } from '@/infra/http/controllers/delete-data.controller';
import { DeleteDataUseCase } from '@/domain/application/use-cases/delete-data';
import { DeleteManyDataController } from '@/infra/http/controllers/delete-many-data.controller';
import { DeleteManyDataUseCase } from '@/domain/application/use-cases/delete-many-data';

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
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
    FetchDataController,
    DeleteDataController,
    DeleteManyDataController,
  ],
  providers: [
    CreatePresignedBotPdfUploadUseCase,
    FetchDataUseCase,
    DeleteDataUseCase,
    DeleteManyDataUseCase,
    PrismaDocumentRepository,
    PrismaOrganizationRepository,
    R2DocumentStorage,
    {
      provide: DocumentRepository,
      useExisting: PrismaDocumentRepository,
    },
    {
      provide: Uploader,
      useExisting: R2DocumentStorage,
    },
    {
      provide: OrganizationRepository,
      useExisting: PrismaOrganizationRepository,
    },
  ],
})
export class AppModule {}
