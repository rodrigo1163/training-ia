import { Module } from '@nestjs/common';
import { AiModule } from '@/infra/ai/ai.module';
import { ContentModule } from '@/infra/content/content.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { MessagingModule } from '@/infra/messaging/messaging.module';
import { StorageModule } from '@/infra/http/storage/storage.module';
import { OrganizationGuard } from './guards/organization.guard';
import { CreateBotController } from './controllers/create-bot.controller';
import { DeleteBotController } from './controllers/delete-bot.controller';
import { DeleteDataController } from './controllers/delete-data.controller';
import { DeleteManyDataController } from './controllers/delete-many-data.controller';
import { DocumentStatusEventsController } from './controllers/document-status-events.controller';
import { EditBotController } from './controllers/edit-bot.controller';
import { EditBotDeploymentController } from './controllers/edit-bot-deployment.controller';
import { EditDocumentTextController } from './controllers/edit-document-text.controller';
import { FetchBotsController } from './controllers/fetch-bots.controller';
import { FetchDataController } from './controllers/fetch-data.controller';
import { GetBotController } from './controllers/get-bot.controller';
import { GetBotDeploymentController } from './controllers/get-bot-deployment.controller';
import { GetDataFileController } from './controllers/get-data-file.controller';
import { GetDocumentDetailsController } from './controllers/get-document-details.controller';
import { PublishBotDeploymentController } from './controllers/publish-bot-deployment.controller';
import { SendBotMessageController } from './controllers/send-bot-message.controller';
import { UploadBotWebsiteController } from './controllers/upload-bot-website.controller';
import { CreateBotUseCase } from '@/domain/application/use-cases/create-bot';
import { DeleteBotUseCase } from '@/domain/application/use-cases/delete-bot';
import { DeleteDataUseCase } from '@/domain/application/use-cases/delete-data';
import { DeleteManyDataUseCase } from '@/domain/application/use-cases/delete-many-data';
import { EditBotUseCase } from '@/domain/application/use-cases/edit-bot';
import { EditBotDeploymentUseCase } from '@/domain/application/use-cases/edit-bot-deployment';
import { EditDocumentTextUseCase } from '@/domain/application/use-cases/edit-document-text';
import { FetchBotsUseCase } from '@/domain/application/use-cases/fetch-bots';
import { FetchDataUseCase } from '@/domain/application/use-cases/fetch-data';
import { GetBotUseCase } from '@/domain/application/use-cases/get-bot';
import { GetBotDeploymentUseCase } from '@/domain/application/use-cases/get-bot-deployment';
import { GetDataFileUseCase } from '@/domain/application/use-cases/get-data-file';
import { GetDocumentDetailsUseCase } from '@/domain/application/use-cases/get-document-details';
import { PublishBotDeploymentUseCase } from '@/domain/application/use-cases/publish-bot-deployment';
import { SendBotMessageUseCase } from '@/domain/application/use-cases/send-bot-message';
import { UploadBotWebsiteUseCase } from '@/domain/application/use-cases/upload-bot-website';
import { UploadBotFileController } from './controllers/upload-bot-file.controller';
import { UploadBotFileUseCase } from '@/domain/application/use-cases/upload-bot-file';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AiModule,
    ContentModule,
    MessagingModule,
  ],
  controllers: [
    UploadBotFileController,
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
    GetBotDeploymentController,
    PublishBotDeploymentController,
    EditBotDeploymentController,
    SendBotMessageController,
  ],
  providers: [
    UploadBotFileUseCase,
    UploadBotWebsiteUseCase,
    FetchDataUseCase,
    GetDocumentDetailsUseCase,
    GetDataFileUseCase,
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
    OrganizationGuard,
  ],
})
export class HttpModule {}
