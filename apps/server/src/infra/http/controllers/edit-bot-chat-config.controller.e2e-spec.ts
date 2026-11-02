import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';

describe('Edit bot chat config (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    await app.init();
    auth = await createAuthenticatedTestContext(app);
    await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Style Bot',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PATCH] /organization/:orgSlug/bots/:botSlug/chat-config', async () => {
    const stylePatch = {
      assistantMessageTextColor: '#111827',
      userMessageTextColor: '#ffffff',
      launcherBackgroundColor: '#0865cf',
      launcherSize: 64,
      launcherIcon: 'sparkles',
      chatBorderColor: '#d1d5db',
      chatBorderWidth: 2,
      chatFontFamily: 'serif',
      chatMessageFontSize: 'lg',
    };

    const response = await auth.agent
      .patch(
        `/organization/${auth.organization.slug}/bots/style-bot/chat-config`,
      )
      .send(stylePatch)
      .expect(200);

    expect(response.body.bot.chatConfig).toMatchObject(stylePatch);

    const botOnDatabase = await prisma.bot.findUnique({
      where: {
        organizationId_slug: {
          organizationId: auth.organization.id,
          slug: 'style-bot',
        },
      },
    });

    expect(botOnDatabase).toMatchObject(stylePatch);
  });
});
