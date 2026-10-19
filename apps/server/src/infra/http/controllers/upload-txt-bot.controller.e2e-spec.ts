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

describe('Upload TXT bot (E2E)', () => {
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
      name: 'Upload TXT Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-txt-bot', async () => {
    const body = Buffer.from('Conteudo do arquivo TXT.', 'utf8');
    const text = 'Texto extraido do TXT.';

    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-txt-bot/upload-txt-bot`,
      )
      .attach('file', body, {
        filename: 'bot.txt',
        contentType: 'text/plain',
      })
      .field('text', text)
      .expect(201);

    const documentId = response.body.documentId as string;
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });
    const content = await prisma.documentContent.findUnique({
      where: { documentId },
    });
    const storedObject = await storage.get(document.storageKey);

    expect(storedObject.body).toEqual(body);
    expect(storedObject.contentType).toBe('text/plain');
    expect(document).toMatchObject({
      name: 'bot.txt',
      contentType: 'text/plain',
      size: body.length,
      status: 'PROCESSING',
    });
    expect(content).toBeNull();

    storage.track(document.storageKey);
  });
});
