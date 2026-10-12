import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EnvService } from '@/infra/env/env.service';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage.js';
import {
  uploadPdfFixture,
  type UploadedPdfFixture,
} from '../../../../test/e2e/helpers/upload-pdf.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Delete many data (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let prisma: PrismaService;
  let storage: R2TestStorage;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    storage = new R2TestStorage(moduleRef.get(EnvService));

    await app.init();

    auth = await createAuthenticatedTestContext(app);

    const botFactory = moduleRef.get(BotFactory);
    await botFactory.makePrismaBot({
      organizationId: new UniqueEntityId(auth.organization.id),
      name: 'Delete Many Data Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  async function uploadPdf(): Promise<UploadedPdfFixture> {
    return uploadPdfFixture({
      agent: auth.agent,
      botSlug: 'delete-many-data-bot',
      organizationSlug: auth.organization.slug,
      prisma,
      storage,
    });
  }

  test('[DELETE] /organization/:organizationSlug/bots/:botSlug/fetch-data', async () => {
    const [firstUpload, secondUpload] = await Promise.all([
      uploadPdf(),
      uploadPdf(),
    ]);

    await auth.agent
      .delete(
        `/organization/${auth.organization.slug}/bots/delete-many-data-bot/fetch-data`,
      )
      .send({
        documentIds: [firstUpload.documentId, secondUpload.documentId],
      })
      .expect(204);

    const documentsOnDatabase = await prisma.document.findMany({
      where: { id: { in: [firstUpload.documentId, secondUpload.documentId] } },
    });
    const [firstFileExistsOnStorage, secondFileExistsOnStorage] =
      await Promise.all([
        storage.exists(firstUpload.storageKey),
        storage.exists(secondUpload.storageKey),
      ]);

    expect(documentsOnDatabase).toHaveLength(0);
    expect(firstFileExistsOnStorage).toBe(false);
    expect(secondFileExistsOnStorage).toBe(false);
  });
});
