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
import { uploadPdfFixture } from '../../../../test/e2e/helpers/upload-pdf.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';

describe('Get data file (E2E)', () => {
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
    await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Get Data File Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[GET] /organization/:orgSlug/bots/:botSlug/fetch-data/:documentId/file', async () => {
    const upload = await uploadPdfFixture({
      agent: auth.agent,
      botSlug: 'get-data-file-bot',
      orgSlug: auth.organization.slug,
      prisma,
      storage,
    });

    const response = await auth.agent
      .get(
        `/organization/${auth.organization.slug}/bots/get-data-file-bot/fetch-data/${upload.documentId}/file`,
      )
      .expect(200);

    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.headers['content-disposition']).toBe(
      'inline; filename="document.pdf"',
    );
    expect(response.body).toEqual(upload.body);
  });
});
