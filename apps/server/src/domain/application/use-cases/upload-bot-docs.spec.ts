import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error';
import { UploadBotDocsUseCase } from './upload-bot-docs';

const docContentType = 'application/msword';
const docBody = Buffer.from('doc-binary');

describe('Upload bot DOCs', () => {
  let documents: InMemoryDocumentRepository;
  let organizationMember: OrganizationMember;
  let bots: InMemoryBotRepository;
  let uploader: FakeUploader;
  let sut: UploadBotDocsUseCase;

  function makeFile(index: number) {
    return {
      fileName: `document-${index}.doc`,
      fileType: docContentType,
      size: docBody.byteLength,
      body: docBody,
    };
  }

  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    bots = new InMemoryBotRepository();
    bots.items.push(
      makeBot(
        { orgId: new UniqueEntityId('organization-1'), name: 'Support Bot' },
        new UniqueEntityId('bot-1'),
      ),
    );
    uploader = new FakeUploader();
    sut = new UploadBotDocsUseCase(documents, uploader, bots);
  });

  it('uploads DOC documents and returns IDs in input order', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      files: [makeFile(1), makeFile(2)],
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.documentIds).toEqual(
      documents.items.map((document) => document.id.toString()),
    );
    expect(documents.items).toHaveLength(2);
    expect(uploader.uploads).toHaveLength(2);
  });

  it('rejects a batch containing an invalid file before uploading', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      files: [makeFile(1), { ...makeFile(2), fileType: 'text/plain' }],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('rejects a batch containing an invalid size before uploading', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      files: [makeFile(1), { ...makeFile(2), size: 0, body: Buffer.alloc(0) }],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('rejects an unknown bot before uploading', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing',
      files: [makeFile(1)],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(uploader.uploads).toHaveLength(0);
  });
});
