import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';

describe('Publish bot deployment (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let botFactory: BotFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    botFactory = moduleRef.get(BotFactory);

    await app.init();
    auth = await createAuthenticatedTestContext(app);

    await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Support Bot',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots/:botSlug/deployment', async () => {
    const response = await auth.agent
      .post(
        `/organization/${auth.organization.slug}/bots/support-bot/deployment`,
      )
      .send({ allowedOrigins: ['https://example.com'] })
      .expect(201);

    expect(response.body).toEqual({
      deployment: {
        id: expect.any(String),
        publicKey: expect.stringMatching(/^dep_/),
        status: 'ACTIVE',
        allowedOrigins: ['https://example.com'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});
