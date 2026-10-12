import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth.js';

describe('Create bot (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    await app.init();

    auth = await createAuthenticatedTestContext(app);
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /organization/:orgSlug/bots', async () => {
    const response = await auth.agent
      .post(`/organization/${auth.organization.slug}/bots`)
      .send({ name: 'Suporte Ágil' })
      .expect(201);

    expect(response.body.bot).toMatchObject({
      id: expect.any(String),
      name: 'Suporte Ágil',
      slug: 'suporte-agil',
      documentCount: 0,
      createdAt: expect.any(String),
    });

    const botOnDatabase = await prisma.bot.findUnique({
      where: {
        organizationId_slug: {
          organizationId: auth.organization.id,
          slug: 'suporte-agil',
        },
      },
    });

    expect(botOnDatabase).toBeTruthy();
  });
});
