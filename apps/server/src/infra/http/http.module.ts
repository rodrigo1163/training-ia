import { Module } from '@nestjs/common';
import { AiModule } from '@/infra/ai/ai.module';
import { ContentModule } from '@/infra/content/content.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { MessagingModule } from '@/infra/messaging/messaging.module';
import { StorageModule } from '@/infra/http/storage/storage.module';
import { OrganizationGuard } from './guards/organization.guard.js';
import { CreateBotController } from './controllers/create-bot.controller.js';
import { DeleteBotController } from './controllers/delete-bot.controller.js';
import { DeleteDataController } from './controllers/delete-data.controller.js';
import { DeleteManyDataController } from './controllers/delete-many-data.controller.js';
import { DocumentStatusEventsController } from './controllers/document-status-events.controller.js';
import { EditBotController } from './controllers/edit-bot.controller.js';
import { EditBotDeploymentController } from './controllers/edit-bot-deployment.controller.js';
import { EditDocumentTextController } from './controllers/edit-document-text.controller.js';
import { FetchBotsController } from './controllers/fetch-bots.controller.js';
import { FetchDataController } from './controllers/fetch-data.controller.js';
import { GetBotController } from './controllers/get-bot.controller.js';
import { GetBotDeploymentController } from './controllers/get-bot-deployment.controller.js';
import { GetDataFileController } from './controllers/get-data-file.controller.js';
import { GetDocumentDetailsController } from './controllers/get-document-details.controller.js';
import { PublishBotDeploymentController } from './controllers/publish-bot-deployment.controller.js';
import { SendBotMessageController } from './controllers/send-bot-message.controller.js';
import { UploadBotWebsiteController } from './controllers/upload-bot-website.controller.js';
import { UploadPdfBotController } from './controllers/upload-pdf-bot.controller.js';
import { UploadPdfsBotController } from './controllers/upload-pdfs-bot.controller.js';
import { UploadTxtBotController } from './controllers/upload-txt-bot.controller.js';
import { UploadTxtsBotController } from './controllers/upload-txts-bot.controller.js';
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
import { UploadBotPdfUseCase } from '@/domain/application/use-cases/upload-bot-pdf';
import { UploadBotPdfsUseCase } from '@/domain/application/use-cases/upload-bot-pdfs';
import { UploadBotTxtUseCase } from '@/domain/application/use-cases/upload-bot-txt';
import { UploadBotTxtsUseCase } from '@/domain/application/use-cases/upload-bot-txts';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AiModule,
    ContentModule,
    MessagingModule,
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
    GetBotDeploymentController,
    PublishBotDeploymentController,
    EditBotDeploymentController,
    SendBotMessageController,
  ],
  providers: [
    UploadBotPdfUseCase,
    UploadBotPdfsUseCase,
    UploadBotTxtUseCase,
    UploadBotTxtsUseCase,
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
