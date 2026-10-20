import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { FakeUploader } from '../../../../test/storage/fake-uploader.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';
import { UploadBotTxtUseCase } from './upload-bot-txt.js';

const txtBody = Buffer.from('ConteÃºdo do arquivo TXT.');

describe('Upload bot TXT', () => {
  let documents: InMemoryDocumentRepository;
  let bots: InMemoryBotRepository;
  let uploader: FakeUploader;
  let organizationMember: OrganizationMember;
  let sut: UploadBotTxtUseCase;

  function validRequest() {
    return {
      organizationMember,
      botSlug: 'support-bot',
      fileName: 'bot-knowledge.txt',
      fileType: 'text/plain',
      size: txtBody.byteLength,
      body: txtBody,
    };
  }

  beforeEach(() => {
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
    sut = new UploadBotTxtUseCase(documents, uploader, bots);
  });

  it('uploads and registers a TXT document', async () => {
    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    const document = result.value.document;
    expect(document.name).toBe('bot-knowledge.txt');
    expect(document.storageKey).toBe(
      `bot-knowledge.txt-${document.id.toString()}.txt`,
    );
    expect(document.contentType).toBe('text/plain');
    expect(document.content).toBeUndefined();
    expect(uploader.uploads[0]).toEqual({
      key: document.storageKey,
      contentType: 'text/plain',
      body: txtBody,
    });
  });

  it.each([
    ['bot-knowledge.pdf', 'text/plain'],
    ['bot-knowledge.txt', 'application/pdf'],
  ])('rejects an invalid TXT type', async (fileName, fileType) => {
    const result = await sut.execute({ ...validRequest(), fileName, fileType });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('rejects a body whose size differs from the declared size', async () => {
    const result = await sut.execute({
      ...validRequest(),
      size: txtBody.byteLength + 1,
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
