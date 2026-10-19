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
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

describe('Get document details (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let documentFactory: DocumentFactory;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory, DocumentFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    documentFactory = moduleRef.get(DocumentFactory);
    prisma = moduleRef.get(PrismaService);

    await app.init();

    auth = await createAuthenticatedTestContext(app);

    const bot = await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Knowledge Bot',
    });

    await documentFactory.makePrismaDocument(
      {
        botId: bot.id,
        name: 'bot-knowledge.pdf',
        storageKey: 'test/document-details/bot-knowledge.pdf',
        updatedAt: new Date('2026-10-11T12:00:00.000Z'),
      },
      new UniqueEntityId('document-details-document'),
    );

    await prisma.documentContent.create({
      data: {
        documentId: 'document-details-document',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto extraÃ­do do PDF.' }] }] },
        processedAt: new Date('2026-10-11T12:00:00.000Z'),
        text: 'Texto extraído do PDF.',
        version: 1,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /organization/:orgSlug/bots/:botSlug/fetch-data/:documentId', async () => {
    const response = await auth.agent
      .get(
        `/organization/${auth.organization.slug}/bots/knowledge-bot/fetch-data/document-details-document`,
      )
      .expect(200);

    expect(response.body).toEqual({
      id: 'document-details-document',
      type: 'PDF',
      title: 'bot-knowledge.pdf',
      url: `/organization/${auth.organization.slug}/bots/knowledge-bot/fetch-data/document-details-document/file`,
      status: 'PENDING',
      lastUpdatedAt: '2026-10-11T12:00:00.000Z',
      text: 'Texto extraído do PDF.',
    });
  });
});
