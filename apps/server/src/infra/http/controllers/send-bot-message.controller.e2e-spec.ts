import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infra/app.module';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { BotFactory } from '../../../../test/factories/make-bot.js';

describe('Send bot message (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let botFactory: BotFactory;
  let deploymentKey: string;

  const origin = 'https://e2e.example.com';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    botFactory = moduleRef.get(BotFactory);

    await app.init();

    const organizationId = randomUUID();
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'E2E Organization',
        slug: `e2e-organization-${organizationId}`,
        createdAt: new Date(),
      },
    });

    const bot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
      name: 'E2E Support Bot',
    });
    deploymentKey = `e2e-deployment-${bot.id.toString()}`;

    await prisma.botDeployment.create({
      data: {
        id: randomUUID(),
        botId: bot.id.toString(),
        publicKey: deploymentKey,
        allowedOrigins: [origin],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('sends a real message and streams the bot response', async () => {
    const response = await request(app.getHttpServer())
      .post(`/public/chat/${deploymentKey}/messages`)
      .set('Origin', origin)
      .send({
        clientMessageId: randomUUID(),
        content: 'Olá, você pode responder esta mensagem de teste?',
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('event: metadata');
    expect(response.text).toContain('event: delta');
    expect(response.text).toContain('event: completed');
  });
});
