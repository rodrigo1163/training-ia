import { vi } from 'vitest';
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
import { UploadBotDocxsUseCase } from './upload-bot-docxs';

const docxContentType =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const docxBody = Buffer.from('docx-binary');

let documents: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let bots: InMemoryBotRepository;
let uploader: FakeUploader;
let sut: UploadBotDocxsUseCase;

function makeFile(index: number) {
  return {
    fileName: `document-${index}.docx`,
    fileType: docxContentType,
    size: docxBody.byteLength,
    body: docxBody,
  };
}

function validRequest() {
  return {
    organizationMember,
    botSlug: 'support-bot',
    files: [makeFile(1), makeFile(2)],
  };
}

describe('Upload bot DOCXs', () => {
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
    sut = new UploadBotDocxsUseCase(documents, uploader, bots);
  });

  it('uploads five DOCX documents and returns IDs in input order', async () => {
    const files = Array.from({ length: 5 }, (_, index) => makeFile(index + 1));
    const result = await sut.execute({ ...validRequest(), files });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.documentIds).toEqual(
      documents.items.map((document) => document.id.toString()),
    );
    expect(documents.items).toHaveLength(5);
    expect(uploader.uploads).toHaveLength(5);
  });

  it('rejects a batch containing an invalid file type before uploading', async () => {
    const result = await sut.execute({
      ...validRequest(),
      files: [makeFile(1), { ...makeFile(2), fileType: 'text/plain' }],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('rejects a batch containing an invalid file size before uploading', async () => {
    const result = await sut.execute({
      ...validRequest(),
      files: [makeFile(1), { ...makeFile(2), size: 0, body: Buffer.alloc(0) }],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('rejects a body whose length differs from the declared size', async () => {
    const result = await sut.execute({
      ...validRequest(),
      files: [{ ...makeFile(1), size: docxBody.byteLength + 1 }],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
  });

  it('rejects an unknown bot before uploading', async () => {
    const result = await sut.execute({ ...validRequest(), botSlug: 'missing' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it('cleans partial uploads when storage fails', async () => {
    vi.spyOn(uploader, 'upload')
      .mockImplementationOnce(async (params) => {
        uploader.uploads.push(params);
      })
      .mockRejectedValueOnce(new Error('Storage unavailable'));

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Storage unavailable',
    );
    expect(uploader.deletedKeys).toEqual([uploader.uploads[0]?.key]);
    expect(documents.items).toHaveLength(0);
  });

  it('cleans all uploads when persistence fails', async () => {
    vi.spyOn(documents, 'createMany').mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Database unavailable',
    );
    expect(uploader.deletedKeys).toEqual(
      uploader.uploads.map((upload) => upload.key),
    );
  });
});
