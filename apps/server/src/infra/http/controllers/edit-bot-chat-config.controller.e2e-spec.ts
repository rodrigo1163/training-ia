import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { createDefaultBotStyle } from '@/domain/enterprise/entities/bot-style';
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
    const defaultStyle = createDefaultBotStyle();
    const style = {
      ...defaultStyle,
      colors: {
        ...defaultStyle.colors,
        light: {
          ...defaultStyle.colors.light,
          assistantMessageTextColor: '#111827',
          userMessageTextColor: '#ffffff',
          launcherBackgroundColor: '#0865cf',
          chatBorderColor: '#d1d5db',
        },
        dark: {
          ...defaultStyle.colors.dark,
          chatBackgroundColor: '#111827',
        },
      },
      launcherSize: 64,
      launcherIcon: 'sparkles' as const,
      chatBorderWidth: 2,
      chatFontFamily: 'serif' as const,
      chatMessageFontSize: 'lg' as const,
    };
    const stylePatch = { style };

    const response = await auth.agent
      .patch(
        `/organization/${auth.organization.slug}/bots/style-bot/chat-config`,
      )
      .send(stylePatch)
      .expect(200);

    expect(response.body.bot.style).toEqual(style);

    const botOnDatabase = await prisma.bot.findUnique({
      where: {
        organizationId_slug: {
          organizationId: auth.organization.id,
          slug: 'style-bot',
        },
      },
    });

    expect(botOnDatabase?.style).toEqual(style);
  });
});
