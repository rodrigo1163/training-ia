import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import type { Uploader } from '../storage/uploader.js';
import { DeleteManyDataUseCase } from './delete-many-data.js';

class FakeStorage implements Uploader {
  public deletedKeys: string[] = [];

  async createPresignedUpload(): Promise<never> {
    throw new Error('Not implemented');
  }

  async deleteObject(input: { key: string }): Promise<void> {
    this.deletedKeys.push(input.key);
  }
}

let documents: InMemoryDocumentRepository;
let organizations: InMemoryOrganizationRepository;
let storage: FakeStorage;
let sut: DeleteManyDataUseCase;

describe('Delete many data', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository();
    organizations = new InMemoryOrganizationRepository();
    organizations.items.push(
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    );
    storage = new FakeStorage();
    sut = new DeleteManyDataUseCase(documents, organizations, storage);

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

  it('should delete all requested documents from storage and repository', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      documentIds: ['document-1', 'document-2'],
    });

    expect(result.isRight()).toBe(true);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/first.pdf',
      'organizations/organization-1/documents/document-2/second.pdf',
    ]);
    expect(
      await documents.findManyByIdsAndOrganizationId(
        ['document-1', 'document-2'],
        'organization-1',
      ),
    ).toEqual([]);
  });

  it('should reject the entire operation when one document is missing', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      documentIds: ['document-1', 'missing-document'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a missing document error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      organizationSlug: 'missing-organization',
      activeOrganizationId: 'organization-1',
      documentIds: ['document-1'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject an organization different from the active one', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-two',
      activeOrganizationId: 'organization-1',
      documentIds: ['document-1'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(storage.deletedKeys).toHaveLength(0);
  });
});
