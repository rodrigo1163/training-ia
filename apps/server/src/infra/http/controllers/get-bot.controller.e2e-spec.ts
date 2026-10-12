import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { GetBotUseCase } from '../../../domain/application/use-cases/get-bot.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { GetBotController } from './get-bot.controller.js';

describe('Get bot (E2E)', () => {
  let app: INestApplication;
  let bots: InMemoryBotRepository;
  let organizations: InMemoryOrganizationRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GetBotController],
      providers: [
        GetBotUseCase,
        InMemoryBotRepository,
        InMemoryOrganizationRepository,
        { provide: BotRepository, useExisting: InMemoryBotRepository },
        {
          provide: OrganizationRepository,
          useExisting: InMemoryOrganizationRepository,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      Reflect.set(req, 'session', {
        session: { activeOrganizationId: 'organization-1' },
        user: { id: 'user-1' },
      });
      next();
    });
    await app.init();

    bots = moduleRef.get(InMemoryBotRepository);
    organizations = moduleRef.get(InMemoryOrganizationRepository);
  });

  beforeEach(() => {
    organizations.items = [
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    ];
    bots.items = [
      {
        id: 'bot-1',
        organizationId: 'organization-1',
        name: 'Support Bot',
        slug: 'support-bot',
        createdAt: new Date('2026-10-11T12:00:00.000Z'),
        documentCount: 3,
      },
      {
        id: 'bot-2',
        organizationId: 'organization-2',
        name: 'Other Bot',
        slug: 'other-bot',
        createdAt: new Date(),
        documentCount: 0,
      },
    ];
  });

  afterAll(async () => app.close());

  it('returns the bot public contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/organization/organization-one/bots/support-bot')
      .expect(200);

    expect(response.body).toEqual({
      bot: {
        id: 'bot-1',
        name: 'Support Bot',
        slug: 'support-bot',
        documentCount: 3,
        createdAt: '2026-10-11T12:00:00.000Z',
      },
    });
  });

  it('returns 404 when the bot is missing or outside the organization hierarchy', async () => {
    await request(app.getHttpServer())
      .get('/organization/organization-one/bots/missing')
      .expect(404);

    await request(app.getHttpServer())
      .get('/organization/organization-one/bots/other-bot')
      .expect(404);
  });

  it('returns 403 for another active organization', async () => {
    await request(app.getHttpServer())
      .get('/organization/organization-two/bots/other-bot')
      .expect(403);
  });
});
