import { createServer, type Server } from 'node:http';
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

describe('Upload bot website (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let prisma: PrismaService;
  let storage: R2TestStorage;
  let websiteServer: Server;
  let websiteUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    storage = new R2TestStorage(moduleRef.get(EnvService));

    await app.init();

    websiteServer = createServer((_, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(
        '<html><body><h1>Example Domain</h1><p>Stable test content.</p></body></html>',
      );
    });

    await new Promise<void>((resolve, reject) => {
      websiteServer.once('error', reject);
      websiteServer.listen(0, '127.0.0.1', resolve);
    });

    const address = websiteServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test website server did not expose a TCP address.');
    }

    websiteUrl = `http://127.0.0.1:${address.port}`;

    auth = await createAuthenticatedTestContext(app);
    await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Upload Website Bot',
    });
  });

  afterAll(async () => {
    await storage.cleanup();
    await new Promise<void>((resolve, reject) => {
      websiteServer.close((error) => (error ? reject(error) : resolve()));
    });
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/upload-website-bot', async () => {
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/upload-website-bot/upload-website-bot`,
      )
      .send({ url: websiteUrl })
      .expect(201);

    const documentId = response.body.documentId as string;
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });
    const content = await prisma.documentContent.findUnique({
      where: { documentId },
    });

    expect(document).toMatchObject({
      name: websiteUrl,
      contentType: 'text/html',
      status: 'PROCESSING',
    });
    expect(content).toBeNull();

    storage.track(document.storageKey);
  });
});
