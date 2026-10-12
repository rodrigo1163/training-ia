import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';

describe('Get bot (E2E)', () => {
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
      organizationId: new UniqueEntityId(auth.organization.id),
      name: 'Support Bot',
      createdAt: new Date('2026-10-11T12:00:00.000Z'),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /organization/:organizationSlug/bots/:botSlug', async () => {
    const response = await auth.agent
      .get(`/organization/${auth.organization.slug}/bots/support-bot`)
      .expect(200);

    expect(response.body).toEqual({
      bot: {
        id: expect.any(String),
        name: 'Support Bot',
        slug: 'support-bot',
        documentCount: 0,
        createdAt: '2026-10-11T12:00:00.000Z',
      },
    });
  });
});
