import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import { DocumentFactory } from '../../../../test/factories/make-document.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Edit document text (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let documentFactory: DocumentFactory;
  let prisma: PrismaService;
  let botId: UniqueEntityId;

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
      name: 'Edit Document Text Bot',
    });
    botId = bot.id;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createDocument() {
    const document = await documentFactory.makePrismaDocument({
      botId,
      name: 'editable-document.pdf',
      status: 'READY',
      textHash: 'old-hash',
    });

    await prisma.documentContent.create({
      data: {
        documentId: document.id.toString(),
        processedAt: new Date('2026-10-11T12:00:00.000Z'),
        text: 'Texto antigo.',
        version: 1,
      },
    });

    return document;
  }

  test('[PATCH] /organization/:orgSlug/bots/:botSlug/data/:documentId', async () => {
    const document = await createDocument();

    const response = await auth.agent
      .patch(
        `/organization/${auth.organization.slug}/bots/edit-document-text-bot/data/${document.id}`,
      )
      .send({ text: 'Texto atualizado.' })
      .expect(200);

    expect(response.body).toEqual({
      documentId: document.id.toString(),
      status: 'PROCESSING',
    });

    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id.toString() },
    });
    const updatedContent = await prisma.documentContent.findUnique({
      where: { documentId: document.id.toString() },
    });

    expect(updatedDocument?.status).toBe('PROCESSING');
    expect(updatedDocument?.textHash).not.toBe('old-hash');
    expect(updatedContent).toMatchObject({
      text: 'Texto atualizado.',
      version: 2,
    });
  });
});
