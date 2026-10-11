import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { CreateBotUseCase } from '../../../domain/application/use-cases/create-bot.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { CreateBotController } from './create-bot.controller.js';

describe('Create bot (E2E)', () => {
  let app: INestApplication;
  let bots: InMemoryBotRepository;
  let organizations: InMemoryOrganizationRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CreateBotController],
      providers: [
        CreateBotUseCase,
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

  it('creates a bot using the public contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/organization/organization-one/bots')
      .send({ name: 'Suporte Ágil' })
      .expect(201);

    expect(response.body.value).toMatchObject({
      id: expect.any(String),
      name: 'Suporte Ágil',
      slug: 'suporte-agil',
      documentCount: 0,
      createdAt: expect.any(String),
    });
  });

  it('returns 400 for an invalid name and 409 for a duplicate slug', async () => {
    await request(app.getHttpServer())
      .post('/organization/organization-one/bots')
      .send({ name: 'x' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/organization/organization-one/bots')
      .send({ name: 'Support Bot' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/organization/organization-one/bots')
      .send({ name: 'support bot' })
      .expect(409);
  });

  it('returns 404 for an unknown organization and 403 for another active organization', async () => {
    await request(app.getHttpServer())
      .post('/organization/missing-organization/bots')
      .send({ name: 'Support Bot' })
      .expect(404);

    await request(app.getHttpServer())
      .post('/organization/organization-two/bots')
      .send({ name: 'Support Bot' })
      .expect(403);
  });
});
