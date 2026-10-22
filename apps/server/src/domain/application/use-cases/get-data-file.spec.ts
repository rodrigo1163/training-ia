import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { FakeUploader } from '../../../../test/storage/fake-uploader.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { StorageDownloadError } from './errors/storage-download-error.js';
import { GetDataFileUseCase } from './get-data-file.js';

let documents: InMemoryDocumentRepository;
let bots: InMemoryBotRepository;
let uploader: FakeUploader;
let organizationMember: OrganizationMember;
let sut: GetDataFileUseCase;

describe('Get data file', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository();
    bots = new InMemoryBotRepository();
    uploader = new FakeUploader();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    bots.items.push(
      makeBot(
        { orgId: new UniqueEntityId('organization-1'), name: 'Support Bot' },
        new UniqueEntityId('bot-1'),
      ),
    );

    const document = makeDocument(
      {
        botId: new UniqueEntityId('bot-1'),
        name: 'knowledge.pdf',
        storageKey: 'documents/knowledge.pdf',
      },
      new UniqueEntityId('document-1'),
    );
    await documents.create(document);
    await uploader.upload({
      key: document.storageKey,
      contentType: document.contentType,
      body: Buffer.from('pdf content'),
    });

    sut = new GetDataFileUseCase(documents, bots, uploader);
  });

  it('downloads a document that belongs to the bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'document-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    expect(result.value.document.documentId.toString()).toBe('document-1');
    expect(result.value.file.body).toEqual(Buffer.from('pdf content'));
  });

  it('rejects an unknown document', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'missing-document',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing document error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('returns a storage error when the file cannot be downloaded', async () => {
    uploader.uploads = [];

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'document-1',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a storage error');
    expect(result.value).toBeInstanceOf(StorageDownloadError);
  });
});
