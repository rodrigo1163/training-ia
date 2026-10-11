import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { Uploader } from '../../../domain/application/storage/uploader.js';
import { DeleteManyDataUseCase } from '../../../domain/application/use-cases/delete-many-data.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { DeleteManyDataController } from './delete-many-data.controller.js';

class InMemoryUploader implements Uploader {
  public deletedKeys: string[] = [];

  async createPresignedUpload(): Promise<never> {
    throw new Error('Not implemented');
  }

  async deleteObject(input: { key: string }): Promise<void> {
    this.deletedKeys.push(input.key);
  }
}

describe('Delete many data (E2E)', () => {
  let app: INestApplication;
  let documents: InMemoryDocumentRepository;
  let organizations: InMemoryOrganizationRepository;
  let storage: InMemoryUploader;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DeleteManyDataController],
      providers: [
        DeleteManyDataUseCase,
        InMemoryDocumentRepository,
        InMemoryOrganizationRepository,
        InMemoryUploader,
        {
          provide: DocumentRepository,
          useExisting: InMemoryDocumentRepository,
        },
        {
          provide: OrganizationRepository,
          useExisting: InMemoryOrganizationRepository,
        },
        {
          provide: Uploader,
          useExisting: InMemoryUploader,
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
    storage = moduleRef.get(InMemoryUploader);
  });

  beforeEach(async () => {
    documents.items = [];
    documents.data = [];
    organizations.items = [
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    ];
    storage.deletedKeys = [];

    await documents.create({
      id: 'document-1',
      organizationId: 'organization-1',
      name: 'first.pdf',
      storageKey: 'organizations/organization-1/documents/document-1/first.pdf',
      contentType: 'application/pdf',
      size: 1024,
      status: 'PENDING',
    });
    await documents.create({
      id: 'document-2',
      organizationId: 'organization-1',
      name: 'second.pdf',
      storageKey:
        'organizations/organization-1/documents/document-2/second.pdf',
      contentType: 'application/pdf',
      size: 2048,
      status: 'PENDING',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete several documents and return no content', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/fetch-data')
      .send({ documentIds: ['document-1', 'document-2'] })
      .expect(204);

    expect(documents.items).toHaveLength(0);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/first.pdf',
      'organizations/organization-1/documents/document-2/second.pdf',
    ]);
  });

  it('should return 404 when one document does not exist', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/fetch-data')
      .send({ documentIds: ['document-1', 'missing-document'] })
      .expect(404);

    expect(documents.items).toHaveLength(2);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should return 403 when the slug is not the active organization', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-two/fetch-data')
      .send({ documentIds: ['document-1'] })
      .expect(403);
  });

  it('should return 404 when the organization slug does not exist', async () => {
    await request(app.getHttpServer())
      .delete('/organization/missing-organization/fetch-data')
      .send({ documentIds: ['document-1'] })
      .expect(404);
  });

  it('should return 400 when no document ids are provided', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/fetch-data')
      .send({ documentIds: [] })
      .expect(400);
  });
});
