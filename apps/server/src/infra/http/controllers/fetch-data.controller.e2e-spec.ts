import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import { DocumentFactory } from '../../../../test/factories/make-document.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

describe('Fetch data (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let botFactory: BotFactory;
  let documentFactory: DocumentFactory;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory, DocumentFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    botFactory = moduleRef.get(BotFactory);
    documentFactory = moduleRef.get(DocumentFactory);
    prisma = moduleRef.get(PrismaService);

    await app.init();
    auth = await createAuthenticatedTestContext(app);

    const bot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Knowledge Bot',
    });

    await documentFactory.makePrismaDocument(
      {
        botId: bot.id,
        name: 'bot-knowledge.pdf',
        storageKey: 'test/fetch-data/bot-knowledge.pdf',
        updatedAt: new Date('2026-10-11T12:00:00.000Z'),
      },
      new UniqueEntityId('fetch-data-document'),
    );

    await prisma.documentContent.create({
      data: {
        documentId: 'fetch-data-document',
        markdown: 'Texto extraído do PDF.',
        processedAt: new Date('2026-10-11T12:00:00.000Z'),
        version: 1,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /organization/:orgSlug/bots/:botSlug/fetch-data', async () => {
    const response = await auth.agent
      .get(
        `/organization/${auth.organization.slug}/bots/knowledge-bot/fetch-data`,
      )
      .expect(200);

    expect(response.body).toEqual({
      documents: [
        {
          id: 'fetch-data-document',
          type: 'PDF',
          url: 'bot-knowledge.pdf',
          status: 'PENDING',
          size: 1024,
          lastUpdatedAt: '2026-10-11T12:00:00.000Z',
        },
      ],
      totalSize: 1024,
    });
  });
});
