import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { FakeUploader } from '../../../../test/storage/fake-uploader.js';
import { DeleteDataUseCase } from './delete-data.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let documents: InMemoryDocumentRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;
let storage: FakeUploader;
let bots: InMemoryBotRepository;
let sut: DeleteDataUseCase;

describe('Delete data', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository();
    organizationMembers = new InMemoryOrganizationMemberRepository();
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-1'),
        userId: new UniqueEntityId('user-1'),
        role: 'owner',
      }),
      'organization-one',
    );
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-2'),
        userId: new UniqueEntityId('user-2'),
        role: 'owner',
      }),
      'organization-two',
    );
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
    sut = new DeleteDataUseCase(documents, organizationMembers, storage, bots);

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
      orgSlug: 'organization-one',
      botSlug: 'bot',
      userId: 'user-1',
      documentId: 'document-1',
    });

    expect(result.isRight()).toBe(true);
    expect(storage.deletedKeys).toEqual([
      'organizations/organization-1/documents/document-1/original.pdf',
    ]);
    expect(await documents.findByIdAndBotId('document-1', 'bot-1')).toBeNull();
  });

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      orgSlug: 'missing-organization',
      botSlug: 'bot',
      userId: 'user-1',
      documentId: 'document-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should reject an organization the user is not a member of', async () => {
    const result = await sut.execute({
      orgSlug: 'organization-two',
      botSlug: 'bot',
      userId: 'user-1',
      documentId: 'document-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(storage.deletedKeys).toHaveLength(0);
  });

  it('should not delete an unknown document', async () => {
    const result = await sut.execute({
      orgSlug: 'organization-one',
      botSlug: 'bot',
      userId: 'user-1',
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
      orgSlug: 'organization-one',
      botSlug: 'other-bot',
      userId: 'user-1',
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
      orgSlug: 'organization-one',
      botSlug: 'missing-bot',
      userId: 'user-1',
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
