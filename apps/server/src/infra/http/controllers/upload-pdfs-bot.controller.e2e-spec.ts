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
import { readPdfFixture } from '../../../../test/e2e/helpers/upload-pdf.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Upload PDFs bot (E2E)', () => {
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
      name: 'Upload PDFs Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-pdfs-bot', async () => {
    const body = await readPdfFixture();
    const texts = Array.from(
      { length: 5 },
      (_, index) => `Texto extraído do PDF ${index + 1}.`,
    );

    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-pdfs-bot/upload-pdfs-bot`,
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
    expect(
      documents.every((document) => document.status === 'PROCESSING'),
    ).toBe(true);

    const contents = await prisma.documentContent.findMany({
      where: { documentId: { in: documentIds } },
    });
    expect(contents).toHaveLength(0);

    for (const document of documents) {
      storage.track(document.storageKey);
    }
  });
});
