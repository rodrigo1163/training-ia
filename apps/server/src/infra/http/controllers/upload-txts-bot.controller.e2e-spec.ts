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
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Upload TXTs bot (E2E)', () => {
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
      name: 'Upload TXTs Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-txts-bot', async () => {
    const files = Array.from({ length: 5 }, (_, index) => ({
      body: Buffer.from(`Conteudo do TXT ${index + 1}.`, 'utf8'),
      fileName: `bot-${index + 1}.txt`,
      text: `Texto extraido ${index + 1}.`,
    }));

    const request = auth.agent.post(
      `/organization/${auth.organization.slug}/bots/upload-txts-bot/upload-txts-bot`,
    );

    for (const file of files) {
      request.attach('files', file.body, {
        filename: file.fileName,
        contentType: 'text/plain',
      });
      request.field('texts', file.text);
    }

    const response = await request.expect(201);
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
