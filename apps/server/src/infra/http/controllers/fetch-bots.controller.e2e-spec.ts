import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { FetchBotsUseCase } from '../../../domain/application/use-cases/fetch-bots.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { FetchBotsController } from './fetch-bots.controller.js';

describe('Fetch bots (E2E)', () => {
  let app: INestApplication;
  let bots: InMemoryBotRepository;
  let organizations: InMemoryOrganizationRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FetchBotsController],
      providers: [
        FetchBotsUseCase,
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
    bots.items = [];
    organizations.items = [
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    ];
  });

  afterAll(async () => app.close());

  it('lists only bots from the selected organization', async () => {
    bots.items.push(
      {
        id: 'bot-2',
        organizationId: 'organization-1',
        name: 'Zulu',
        slug: 'zulu',
        createdAt: new Date('2026-10-11T12:00:00.000Z'),
        documentCount: 2,
      },
      {
        id: 'bot-1',
        organizationId: 'organization-1',
        name: 'Alpha',
        slug: 'alpha',
        createdAt: new Date('2026-10-10T12:00:00.000Z'),
        documentCount: 0,
      },
      {
        id: 'bot-3',
        organizationId: 'organization-2',
        name: 'Other',
        slug: 'other',
        createdAt: new Date(),
        documentCount: 0,
      },
    );

    const response = await request(app.getHttpServer())
      .get('/organization/organization-one/bots')
      .expect(200);

    expect(response.body.value.map((bot: { slug: string }) => bot.slug)).toEqual([
      'alpha',
      'zulu',
    ]);
  });

  it('returns an empty list when the organization has no bots', async () => {
    const response = await request(app.getHttpServer())
      .get('/organization/organization-one/bots')
      .expect(200);

    expect(response.body).toEqual({ value: [] });
  });

  it('returns 404 for an unknown organization and 403 for another active organization', async () => {
    await request(app.getHttpServer())
      .get('/organization/missing-organization/bots')
      .expect(404);

    await request(app.getHttpServer())
      .get('/organization/organization-two/bots')
      .expect(403);
  });
});
