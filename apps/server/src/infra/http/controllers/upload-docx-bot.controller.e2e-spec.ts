import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EnvService } from '@/infra/env/env.service';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage';
import { binaryParser } from '../../../../test/e2e/helpers/binary-parser';

const docxContentType =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const docxFileName = 'document.docx';

describe('Upload DOCX bot (E2E)', () => {
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
      name: 'Upload DOCX Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-docx-bot', async () => {
    const body = await readFile(
      resolve(process.cwd(), 'test/e2e/fixtures', docxFileName),
    );
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-docx-bot/upload-docx-bot`,
      )
      .attach('file', body, {
        filename: docxFileName,
        contentType: docxContentType,
      })
      .expect(201);

    expect(response.body).toEqual({ documentId: expect.any(String) });

    const documentId = response.body.documentId as string;
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });
    const storedObject = await storage.get(document.storageKey);

    expect(document.name).toBe(docxFileName);
    expect(document.storageKey).toMatch(/\.docx$/);
    expect(document.contentType).toBe(docxContentType);
    expect(document.status).toBe('PROCESSING');
    expect(storedObject.body).toEqual(body);
    expect(storedObject.contentType).toBe(docxContentType);

    const download = await auth.agent
      .get(
        `/organization/${auth.organization.slug}/bots/upload-docx-bot/fetch-data/${documentId}/file`,
      )
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(download.headers['content-type']).toContain(docxContentType);
    expect(download.body).toEqual(body);
    storage.track(document.storageKey);
  });
});
