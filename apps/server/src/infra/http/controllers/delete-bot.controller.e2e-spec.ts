import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { BotFactory } from '../../../../test/factories/make-bot.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';

describe('Delete bot (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let botFactory: BotFactory;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    botFactory = moduleRef.get(BotFactory);
    prisma = moduleRef.get(PrismaService);

    await app.init();

    auth = await createAuthenticatedTestContext(app);
  });

  afterAll(async () => {
    await app.close();
  });

  test('[DELETE] /organization/:organizationSlug/bots/:botSlug', async () => {
    const bot = await botFactory.makePrismaBot({
      organizationId: auth.organization.id,
      name: 'Empty Bot',
      slug: 'empty-bot',
    });

    await auth.agent
      .delete(`/organization/${auth.organization.slug}/bots/empty-bot`)
      .expect(204);

    const botOnDatabase = await prisma.bot.findUnique({
      where: { id: bot.id },
    });

    expect(botOnDatabase).toBeNull();
  });
});
