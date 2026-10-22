import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvService } from '@/infra/env/env.service';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage.js';

const docContentType = 'application/msword';

describe('Upload DOC bot (E2E)', () => {
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
      name: 'Upload DOC Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-doc-bot', async () => {
    const body = Buffer.from('DOC test fixture');
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-doc-bot/upload-doc-bot`,
      )
      .attach('file', body, {
        filename: 'bot-knowledge.doc',
        contentType: docContentType,
      })
      .expect(201);

    expect(response.body).toEqual({ documentId: expect.any(String) });

    const documentId = response.body.documentId as string;
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });
    const storedObject = await storage.get(document.storageKey);

    expect(document.name).toBe('bot-knowledge.doc');
    expect(document.storageKey).toMatch(/\.doc$/);
    expect(document.contentType).toBe(docContentType);
    expect(document.status).toBe('PROCESSING');
    expect(storedObject.body).toEqual(body);
    expect(storedObject.contentType).toBe(docContentType);

    const download = await auth.agent
      .get(
        `/organization/${auth.organization.slug}/bots/upload-doc-bot/fetch-data/${documentId}/file`,
      )
      .expect(200);

    expect(download.headers['content-type']).toContain(docContentType);
    expect(download.body).toEqual(body);
    storage.track(document.storageKey);
  });
});
