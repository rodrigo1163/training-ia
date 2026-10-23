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
import { UploadBotDocxUseCase } from './upload-bot-docx';

const docxContentType =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const docxBody = Buffer.from('docx-binary');

let documents: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let bots: InMemoryBotRepository;
let uploader: FakeUploader;
let sut: UploadBotDocxUseCase;

function validRequest() {
  return {
    organizationMember,
    botSlug: 'support-bot',
    fileName: 'bot-knowledge.docx',
    fileType: docxContentType,
    size: docxBody.byteLength,
    body: docxBody,
  };
}

describe('Upload bot DOCX', () => {
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
    sut = new UploadBotDocxUseCase(documents, uploader, bots);
  });

  it('uploads and registers a DOCX document', async () => {
    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    const document = documents.items[0];
    expect(result.value.document).toEqual(document);
    expect(document.name).toBe('bot-knowledge.docx');
    expect(document.storageKey).toBe(
      `bot-knowledge.docx-${document.id.toString()}.docx`,
    );
    expect(document.contentType).toBe(docxContentType);
    expect(document.size).toBe(docxBody.byteLength);
    expect(document.status).toBe('PROCESSING');
    expect(uploader.uploads).toEqual([
      { key: document.storageKey, contentType: docxContentType, body: docxBody },
    ]);
  });

  it('accepts a DOCX filename with an uppercase extension', async () => {
    const result = await sut.execute({
      ...validRequest(),
      fileName: 'BOT-KNOWLEDGE.DOCX',
    });

    expect(result.isRight()).toBe(true);
    expect(documents.items[0]?.name).toBe('BOT-KNOWLEDGE.DOCX');
  });

  it.each([
    { fileName: 'bot-knowledge.pdf', fileType: docxContentType },
    { fileName: 'bot-knowledge.docx', fileType: 'application/octet-stream' },
  ])('rejects an invalid DOCX type', async ({ fileName, fileType }) => {
    const result = await sut.execute({ ...validRequest(), fileName, fileType });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid type error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(uploader.uploads).toHaveLength(0);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 10 * 1024 * 1024 + 1])(
    'rejects an invalid DOCX size: %s',
    async (size) => {
      const result = await sut.execute({ ...validRequest(), size });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('Expected an invalid size error');
      expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
      expect(uploader.uploads).toHaveLength(0);
    },
  );

  it('rejects an empty DOCX', async () => {
    const result = await sut.execute({
      ...validRequest(),
      size: 0,
      body: Buffer.alloc(0),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid size error');
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
  });

  it('rejects a body whose length differs from the declared size', async () => {
    const result = await sut.execute({
      ...validRequest(),
      size: docxBody.byteLength + 1,
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
    expect(uploader.uploads).toHaveLength(0);
  });

  it('does not create a document when storage upload fails', async () => {
    vi.spyOn(uploader, 'upload').mockRejectedValueOnce(
      new Error('Storage unavailable'),
    );

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Storage unavailable',
    );
    expect(documents.items).toHaveLength(0);
  });
});
