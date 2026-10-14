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
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Upload PDF bot (E2E)', () => {
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
      name: 'Upload Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-pdf-bot', async () => {
    const upload = await uploadPdfFixture({
      agent: auth.agent,
      botSlug: 'upload-bot',
      orgSlug: auth.organization.slug,
      prisma,
      storage,
    });

    const storedObject = await storage.get(upload.storageKey);

    expect(storedObject.body).toEqual(upload.body);
    expect(storedObject.contentType).toBe('application/pdf');

    const document = await prisma.document.findUnique({
      where: { id: upload.documentId },
    });

    expect(document).toEqual({
      id: upload.documentId,
      botId: expect.any(String),
      name: upload.fileName,
      storageKey: upload.storageKey,
      contentType: 'application/pdf',
      size: upload.body.length,
      status: 'PROCESSING',
      textHash: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    const content = await prisma.documentContent.findUnique({
      where: { documentId: upload.documentId },
    });

    expect(content).toEqual({
      documentId: upload.documentId,
      text: upload.text,
      processedAt: expect.any(Date),
      version: 1,
    });
  });
});
