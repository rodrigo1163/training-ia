import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { FakeUploader } from '../../../../test/storage/fake-uploader.js';
import { DeleteDataUseCase } from './delete-data.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

let documents: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let storage: FakeUploader;
let bots: InMemoryBotRepository;
let sut: DeleteDataUseCase;

describe('Delete data', () => {
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
          documentCount: 1,
        },
        new UniqueEntityId('bot-1'),
      ),
    );
    sut = new DeleteDataUseCase(documents, storage, bots);

    await documents.create(
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'bot-knowledge.pdf',
          storageKey:
            'organizations/organization-1/documents/document-1/original.pdf',
        },
        new UniqueEntityId('document-1'),
      ),
    );
  });

  it('should delete the document from storage and the repository', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'bot',
      documentId: 'document-1',
    });

    expect(result.isRight()).toBe(true);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/original.pdf',
    ]);
    expect(await documents.findByIdAndBotId('document-1', 'bot-1')).toBeNull();
  });

  it('should not delete an unknown document', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'bot',
      documentId: 'missing-document',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a missing document error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should not delete a document from another bot', async () => {
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
      organizationMember,
      botSlug: 'other-bot',
      documentId: 'document-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(storage.deletedKeys).toHaveLength(0);
    expect(
      await documents.findByIdAndBotId('document-1', 'bot-1'),
    ).not.toBeNull();
  });

  it('should not delete data from an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      documentId: 'document-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a missing bot error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(storage.deletedKeys).toHaveLength(0);
    expect(
      await documents.findByIdAndBotId('document-1', 'bot-1'),
    ).not.toBeNull();
  });
});
