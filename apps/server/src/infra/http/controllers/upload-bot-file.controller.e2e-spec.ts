import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvService } from '@/infra/env/env.service';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage';
import { readPdfFixture } from '../../../../test/e2e/helpers/upload-pdf';

describe('Upload bot file (E2E)', () => {
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
      name: 'Upload File Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-file', async () => {
    const body = await readPdfFixture();
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-file/upload-file`,
      )
      .attach('file', body, {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(response.body).toEqual({ documentId: expect.any(String) });

    const document = await prisma.document.findUniqueOrThrow({
      where: { id: response.body.documentId },
    });
    const storedObject = await storage.get(document.storageKey);

    expect(document).toMatchObject({
      name: 'document.pdf',
      contentType: 'application/pdf',
      size: body.length,
      status: 'PROCESSING',
    });
    expect(storedObject.body).toEqual(body);
    expect(storedObject.contentType).toBe('application/pdf');

    storage.track(document.storageKey);
  });
});
