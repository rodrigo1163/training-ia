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
  readPdfFixture,
  uploadPdfFixture,
} from '../../../../test/e2e/helpers/upload-pdf.js';
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
    const botFactory = moduleRef.get(BotFactory);

    await botFactory.makePrismaBot({
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

  test('rejects an upload without extracted text', async () => {
    const body = await readPdfFixture();

    await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-bot/upload-pdf-bot`,
      )
      .attach('file', body, {
        filename: 'bot.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-pdfs-bot', async () => {
    const body = await readPdfFixture();
    const texts = Array.from(
      { length: 5 },
      (_, index) => `Texto extraído do PDF ${index + 1}.`,
    );
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-bot/upload-pdfs-bot`,
      )
      .attach('files', body, {
        filename: 'bot-1.pdf',
        contentType: 'application/pdf',
      })
      .attach('files', body, {
        filename: 'bot-2.pdf',
        contentType: 'application/pdf',
      })
      .attach('files', body, {
        filename: 'bot-3.pdf',
        contentType: 'application/pdf',
      })
      .attach('files', body, {
        filename: 'bot-4.pdf',
        contentType: 'application/pdf',
      })
      .attach('files', body, {
        filename: 'bot-5.pdf',
        contentType: 'application/pdf',
      })
      .field('texts', texts[0])
      .field('texts', texts[1])
      .field('texts', texts[2])
      .field('texts', texts[3])
      .field('texts', texts[4])
      .expect(201);

    const documentIds = response.body.documentIds as string[];
    expect(documentIds).toHaveLength(5);

    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds } },
      orderBy: { createdAt: 'asc' },
    });
    expect(documents).toHaveLength(5);
    expect(documents.every((document) => document.status === 'PROCESSING')).toBe(
      true,
    );

    const contents = await prisma.documentContent.findMany({
      where: { documentId: { in: documentIds } },
    });
    expect(contents).toHaveLength(5);
    expect(contents.map((content) => content.text).sort()).toEqual(
      [...texts].sort(),
    );

    for (const document of documents) {
      storage.track(document.storageKey);
    }
  });

  test('rejects multiple uploads when files and texts are not aligned', async () => {
    const beforeCount = await prisma.document.count();
    const body = await readPdfFixture();

    await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-bot/upload-pdfs-bot`,
      )
      .attach('files', body, {
        filename: 'mismatch-1.pdf',
        contentType: 'application/pdf',
      })
      .attach('files', body, {
        filename: 'mismatch-2.pdf',
        contentType: 'application/pdf',
      })
      .field('texts', 'Apenas um texto')
      .expect(400);

    expect(await prisma.document.count()).toBe(beforeCount);
  });
});
