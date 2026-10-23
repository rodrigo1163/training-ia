import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EnvService } from '@/infra/env/env.service';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage';
import { uploadPdfFixture } from '../../../../test/e2e/helpers/upload-pdf';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Delete data (E2E)', () => {
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
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Delete Data Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[DELETE] /organization/:orgSlug/bots/:botSlug/fetch-data/:documentId', async () => {
    const upload = await uploadPdfFixture({
      agent: auth.agent,
      botSlug: 'delete-data-bot',
      orgSlug: auth.organization.slug,
      prisma,
      storage,
    });

    await auth.agent
      .delete(
        `/organization/${auth.organization.slug}/bots/delete-data-bot/fetch-data/${upload.documentId}`,
      )
      .expect(204);

    const documentOnDatabase = await prisma.document.findUnique({
      where: { id: upload.documentId },
    });
    const fileExistsOnStorage = await storage.exists(upload.storageKey);

    expect(documentOnDatabase).toBeNull();
    expect(fileExistsOnStorage).toBe(false);
  });
});
