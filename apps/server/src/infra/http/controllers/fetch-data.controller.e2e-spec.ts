import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { FetchDataUseCase } from '../../../domain/application/use-cases/fetch-data.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { FetchDataController } from './fetch-data.controller.js';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';

describe('Fetch data (E2E)', () => {
  let app: INestApplication;
  let documents: InMemoryDocumentRepository;
  let organizations: InMemoryOrganizationRepository;
  let bots: InMemoryBotRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FetchDataController],
      providers: [
        FetchDataUseCase,
        InMemoryDocumentRepository,
        InMemoryOrganizationRepository,
        InMemoryBotRepository,
        {
          provide: BotRepository,
          useExisting: InMemoryBotRepository,
        },
        {
          provide: DocumentRepository,
          useExisting: InMemoryDocumentRepository,
        },
        {
          provide: OrganizationRepository,
          useExisting: InMemoryOrganizationRepository,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((request: Request, _response: Response, next: NextFunction) => {
      Reflect.set(request, 'session', {
        session: { activeOrganizationId: 'organization-1' },
        user: { id: 'user-1' },
      });
      next();
    });
    await app.init();

    documents = moduleRef.get(InMemoryDocumentRepository);
    organizations = moduleRef.get(InMemoryOrganizationRepository);
    bots = moduleRef.get(InMemoryBotRepository);
  });

  beforeEach(() => {
    documents.data = [];
    organizations.items = [
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    ];
    bots.items = [
      {
        id: 'bot-1',
        organizationId: 'organization-1',
        name: 'Bot',
        slug: 'bot',
        createdAt: new Date(),
        documentCount: 0,
      },
    ];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return the organization data using the public contract', async () => {
    documents.data.push({
      id: 'document-1',
      botId: 'bot-1',
      name: 'bot-knowledge.pdf',
      contentType: 'application/pdf',
      status: 'PENDING',
      updatedAt: new Date('2026-10-11T12:00:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .get('/organization/organization-one/bots/bot/fetch-data')
      .expect(200);

    expect(response.body).toEqual({
      value: [
        {
          id: 'document-1',
          type: 'PDF',
          url: 'bot-knowledge.pdf',
          status: 'PENDING',
          lastUpdatedAt: '2026-10-11T12:00:00.000Z',
        },
      ],
    });
  });

  it('should return an empty list when the organization has no data', async () => {
    const response = await request(app.getHttpServer())
      .get('/organization/organization-one/bots/bot/fetch-data')
      .expect(200);

    expect(response.body).toEqual({ value: [] });
  });

  it('should return 404 for an unknown organization slug', async () => {
    await request(app.getHttpServer())
      .get('/organization/missing-organization/bots/bot/fetch-data')
      .expect(404);
  });

  it('should return 403 for a different active organization', async () => {
    await request(app.getHttpServer())
      .get('/organization/organization-two/bots/bot/fetch-data')
      .expect(403);
  });
});
