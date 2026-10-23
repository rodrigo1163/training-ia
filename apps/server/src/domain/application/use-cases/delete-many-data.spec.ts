import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import { DeleteManyDataUseCase } from './delete-many-data';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeBot } from '../../../../test/factories/make-bot';
import { makeDocument } from '../../../../test/factories/make-document';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

let documents: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let storage: FakeUploader;
let bots: InMemoryBotRepository;
let sut: DeleteManyDataUseCase;

describe('Delete many data', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    storage = new FakeUploader();
    bots = new InMemoryBotRepository();
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Bot',
          documentCount: 2,
        },
        new UniqueEntityId('bot-1'),
      ),
    );
    sut = new DeleteManyDataUseCase(
      documents,
      storage,
      bots,
    );

    await documents.create(
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'first.pdf',
          storageKey:
            'organizations/organization-1/documents/document-1/first.pdf',
        },
        new UniqueEntityId('document-1'),
      ),
    );
    await documents.create(
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'second.pdf',
          storageKey:
            'organizations/organization-1/documents/document-2/second.pdf',
          size: 2048,
        },
        new UniqueEntityId('document-2'),
      ),
    );
  });

  it('should delete all requested documents from storage and repository', async () => {
    const result = await sut.execute({
      botSlug: 'bot',
      organizationMember,
      documentIds: ['document-1', 'document-2'],
    });

    expect(result.isRight()).toBe(true);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/first.pdf',
      'organizations/organization-1/documents/document-2/second.pdf',
    ]);
    expect(
      await documents.findManyByIdsAndBotId(
        ['document-1', 'document-2'],
        'bot-1',
      ),
    ).toEqual([]);
  });

  it('should reject the entire operation when one document is missing', async () => {
    const result = await sut.execute({
      botSlug: 'bot',
      organizationMember,
      documentIds: ['document-1', 'missing-document'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a missing document error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should reject documents that do not belong to the selected bot', async () => {
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Other Bot',
        },
        new UniqueEntityId('bot-2'),
      ),
    );

    const result = await sut.execute({
      botSlug: 'other-bot',
      organizationMember,
      documentIds: ['document-1'],
    });

    expect(result.isLeft()).toBe(true);
    expect(storage.deletedKeys).toHaveLength(0);
    expect(
      await documents.findManyByIdsAndBotId(['document-1'], 'bot-1'),
    ).toHaveLength(1);
  });

  it('should reject an empty document list', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'bot',
      documentIds: [],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected an empty document list error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should reject an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      documentIds: ['document-1'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should ignore duplicated document ids', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'bot',
      documentIds: ['document-1', 'document-1'],
    });

    expect(result.isRight()).toBe(true);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/first.pdf',
    ]);
    expect(
      await documents.findManyByIdsAndBotId(['document-1'], 'bot-1'),
    ).toEqual([]);
  });
});
