import { vi } from 'vitest';
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
import { UploadBotTxtsUseCase } from './upload-bot-txts.js';

const txtBody = Buffer.from('ConteÃºdo do arquivo TXT.');

let inMemoryDocumentRepository: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let inMemoryBotRepository: InMemoryBotRepository;
let fakeUploader: FakeUploader;
let sut: UploadBotTxtsUseCase;

function makeFile(index: number) {
  return {
    fileName: `document-${index}.txt`,
    fileType: 'text/plain',
    size: txtBody.byteLength,
    body: txtBody,
    text: `Extracted text ${index}`,
  };
}

function validRequest() {
  return {
    organizationMember,
    botSlug: 'support-bot',
    files: [makeFile(1), makeFile(2)],
  };
}

describe('Upload bot TXTs', () => {
  beforeEach(() => {
    inMemoryDocumentRepository = new InMemoryDocumentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    inMemoryBotRepository = new InMemoryBotRepository();
    inMemoryBotRepository.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'Support Bot',
        },
        new UniqueEntityId('bot-1'),
      ),
    );
    fakeUploader = new FakeUploader();
    sut = new UploadBotTxtsUseCase(
      inMemoryDocumentRepository,
      fakeUploader,
      inMemoryBotRepository,
    );
  });

  it('uploads TXT files and returns IDs in input order', async () => {
    const files = Array.from({ length: 5 }, (_, index) => makeFile(index + 1));

    const result = await sut.execute({ ...validRequest(), files });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    expect(result.value.documentIds).toEqual(
      inMemoryDocumentRepository.items.map((document) =>
        document.id.toString(),
      ),
    );
    expect(inMemoryDocumentRepository.items).toHaveLength(5);
    expect(inMemoryDocumentRepository.contents).toHaveLength(0);
    expect(fakeUploader.uploads).toHaveLength(5);
  });

  it('rejects a batch containing an invalid file type before uploading anything', async () => {
    const files = [makeFile(1), { ...makeFile(2), fileType: 'application/pdf' }];

    const result = await sut.execute({ ...validRequest(), files });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');

    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('rejects a batch containing an invalid file size before uploading anything', async () => {
    const files = [makeFile(1), { ...makeFile(2), size: 0 }];

    const result = await sut.execute({ ...validRequest(), files });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');

    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('rejects an unknown bot before uploading anything', async () => {
    const result = await sut.execute({
      ...validRequest(),
      botSlug: 'missing-bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('cleans uploaded objects when storage fails halfway through the batch', async () => {
    vi.spyOn(fakeUploader, 'upload')
      .mockImplementationOnce(async (params) => {
        fakeUploader.uploads.push(params);
      })
      .mockRejectedValueOnce(new Error('Storage unavailable'));

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Storage unavailable',
    );

    expect(fakeUploader.deletedKeys).toEqual([
      fakeUploader.uploads[0]?.key,
    ]);
    expect(inMemoryDocumentRepository.items).toHaveLength(0);
  });

  it('cleans all uploaded objects when persistence fails', async () => {
    vi.spyOn(inMemoryDocumentRepository, 'createMany').mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Database unavailable',
    );

    expect(fakeUploader.deletedKeys).toEqual(
      fakeUploader.uploads.map((upload) => upload.key),
    );
    expect(inMemoryDocumentRepository.items).toHaveLength(0);
  });
});
