import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';

describe('Fetch bots (E2E)', () => {
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

    await Promise.all([
      botFactory.makePrismaBot({
        organizationId: auth.organization.id,
        name: 'Zulu',
        slug: 'zulu',
        createdAt: new Date('2026-10-11T12:00:00.000Z'),
      }),
      botFactory.makePrismaBot({
        organizationId: auth.organization.id,
        name: 'Alpha',
        slug: 'alpha',
        createdAt: new Date('2026-10-10T12:00:00.000Z'),
      }),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /organization/:organizationSlug/bots', async () => {
    const response = await auth.agent
      .get(`/organization/${auth.organization.slug}/bots`)
      .expect(200);

    expect(response.body.bots.map((bot: { slug: string }) => bot.slug)).toEqual(
      ['alpha', 'zulu'],
    );
  });
});
