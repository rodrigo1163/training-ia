import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { Uploader } from '../../../domain/application/storage/uploader.js';
import { DeleteDataUseCase } from '../../../domain/application/use-cases/delete-data.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { DeleteDataController } from './delete-data.controller.js';

class InMemoryUploader implements Uploader {
  public deletedKeys: string[] = [];

  async createPresignedUpload(): Promise<never> {
    throw new Error('Not implemented');
  }

  async deleteObject(input: { key: string }): Promise<void> {
    this.deletedKeys.push(input.key);
  }
}

describe('Delete data (E2E)', () => {
  let app: INestApplication;
  let documents: InMemoryDocumentRepository;
  let organizations: InMemoryOrganizationRepository;
  let storage: InMemoryUploader;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DeleteDataController],
      providers: [
        DeleteDataUseCase,
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
      name: 'bot-knowledge.pdf',
      storageKey:
        'organizations/organization-1/documents/document-1/original.pdf',
      contentType: 'application/pdf',
      size: 1024,
      status: 'PENDING',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a document and return no content', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/fetch-data/document-1')
      .expect(204);

    expect(documents.items).toHaveLength(0);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/original.pdf',
    ]);
  });

  it('should return 404 when the document does not exist', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-one/fetch-data/missing-document')
      .expect(404);
  });

  it('should return 403 when the slug is not the active organization', async () => {
    await request(app.getHttpServer())
      .delete('/organization/organization-two/fetch-data/document-1')
      .expect(403);
  });
});
