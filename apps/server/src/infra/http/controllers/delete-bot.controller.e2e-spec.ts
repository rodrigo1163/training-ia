import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { DeleteBotUseCase } from '../../../domain/application/use-cases/delete-bot.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { DeleteBotController } from './delete-bot.controller.js';

describe('Delete bot (E2E)', () => {
  let app: INestApplication;
  let bots: InMemoryBotRepository;
  let organizations: InMemoryOrganizationRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DeleteBotController],
      providers: [
        DeleteBotUseCase,
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
        id: 'empty',
        organizationId: 'organization-1',
        name: 'Empty',
        slug: 'empty',
        createdAt: new Date(),
        documentCount: 0,
      },
      {
        id: 'full',
        organizationId: 'organization-1',
        name: 'Full',
        slug: 'full',
        createdAt: new Date(),
        documentCount: 1,
      },
    ];
  });

  afterAll(async () => app.close());

  it('deletes an empty bot', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/bots/empty')
      .expect(204);

    expect(bots.items.map((bot) => bot.slug)).toEqual(['full']);
  });

  it('returns 409 when the bot has documents', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/bots/full')
      .expect(409);

    expect(bots.items).toHaveLength(2);
  });

  it('returns 404 for an unknown bot and 403 for another active organization', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/bots/missing')
      .expect(404);

    await request(app.getHttpServer())
      .delete('/organization/organization-two/bots/missing')
      .expect(403);
  });
});
