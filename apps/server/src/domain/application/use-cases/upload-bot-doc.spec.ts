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
import { UploadBotDocUseCase } from './upload-bot-doc';

const docContentType = 'application/msword';
const docBody = Buffer.from('doc-binary');

describe('Upload bot DOC', () => {
  let documents: InMemoryDocumentRepository;
  let organizationMember: OrganizationMember;
  let bots: InMemoryBotRepository;
  let uploader: FakeUploader;
  let sut: UploadBotDocUseCase;

  function validRequest() {
    return {
      organizationMember,
      botSlug: 'support-bot',
      fileName: 'bot-knowledge.doc',
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
    sut = new UploadBotDocUseCase(documents, uploader, bots);
  });

  it('uploads and registers a DOC document', async () => {
    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    const document = documents.items[0];
    expect(result.value.document).toEqual(document);
    expect(document.name).toBe('bot-knowledge.doc');
    expect(document.storageKey).toBe(
      `bot-knowledge.doc-${document.id.toString()}.doc`,
    );
    expect(document.contentType).toBe(docContentType);
    expect(document.status).toBe('PROCESSING');
    expect(uploader.uploads).toEqual([
      { key: document.storageKey, contentType: docContentType, body: docBody },
    ]);
  });

  it('accepts a DOC filename with an uppercase extension', async () => {
    const result = await sut.execute({
      ...validRequest(),
      fileName: 'BOT-KNOWLEDGE.DOC',
    });

    expect(result.isRight()).toBe(true);
  });

  it.each([
    { fileName: 'bot-knowledge.docx', fileType: docContentType },
    { fileName: 'bot-knowledge.doc', fileType: 'text/plain' },
  ])('rejects an invalid DOC type', async ({ fileName, fileType }) => {
    const result = await sut.execute({ ...validRequest(), fileName, fileType });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('accepts DOC files reported as application/octet-stream', async () => {
    const result = await sut.execute({
      ...validRequest(),
      fileType: 'application/octet-stream',
    });

    expect(result.isRight()).toBe(true);
  });

  it('rejects an invalid DOC size', async () => {
    const result = await sut.execute({
      ...validRequest(),
      size: docBody.byteLength + 1,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({ ...validRequest(), botSlug: 'missing' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
