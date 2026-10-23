import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

describe('Edit bot (E2E)', () => {
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
      name: 'Edit Bot',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PATCH] /organization/:orgSlug/bots/:botSlug', async () => {
    const response = await auth.agent
      .patch(`/organization/${auth.organization.slug}/bots/edit-bot`)
      .send({
        name: 'Updated Bot',
        description: 'Updated bot description',
        personality: 'PROFESSIONAL',
        language: 'en-US',
        systemMessage: 'Answer clearly and directly.',
      })
      .expect(200);

    expect(response.body.bot).toMatchObject({
      name: 'Updated Bot',
      description: 'Updated bot description',
      personality: 'PROFESSIONAL',
      language: 'en-US',
      systemMessage: 'Answer clearly and directly.',
      slug: 'edit-bot',
      documentCount: 0,
    });

    const botOnDatabase = await prisma.bot.findUnique({
      where: {
        organizationId_slug: {
          organizationId: auth.organization.id,
          slug: 'edit-bot',
        },
      },
    });

    expect(botOnDatabase).toMatchObject({
      name: 'Updated Bot',
      description: 'Updated bot description',
      personality: 'PROFESSIONAL',
      language: 'en-US',
      systemMessage: 'Answer clearly and directly.',
    });
  });
});
