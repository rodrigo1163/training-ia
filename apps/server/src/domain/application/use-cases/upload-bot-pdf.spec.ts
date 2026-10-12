import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { FakeUploader } from '../../../../test/storage/fake-uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';
import { UploadBotPdfUseCase } from './upload-bot-pdf.js';

const pdfBody = Buffer.from('%PDF-1.7');

let inMemoryDocumentRepository: InMemoryDocumentRepository;
let inMemoryOrganizationRepository: InMemoryOrganizationRepository;
let inMemoryBotRepository: InMemoryBotRepository;
let fakeUploader: FakeUploader;
let sut: UploadBotPdfUseCase;

function validRequest() {
  return {
    organizationSlug: 'organization-one',
    botSlug: 'support-bot',
    activeOrganizationId: 'organization-1',
    fileName: 'bot-knowledge.pdf',
    fileType: 'application/pdf',
    size: pdfBody.byteLength,
    body: pdfBody,
  };
}

describe('Upload bot PDF', () => {
  beforeEach(() => {
    inMemoryDocumentRepository = new InMemoryDocumentRepository();
    inMemoryOrganizationRepository = new InMemoryOrganizationRepository();
    inMemoryOrganizationRepository.items.push({
      id: 'organization-1',
      slug: 'organization-one',
    });
    inMemoryBotRepository = new InMemoryBotRepository();
    inMemoryBotRepository.items.push({
      id: 'bot-1',
      organizationId: 'organization-1',
      name: 'Support Bot',
      slug: 'support-bot',
      createdAt: new Date(),
      documentCount: 0,
    });
    fakeUploader = new FakeUploader();
    sut = new UploadBotPdfUseCase(
      inMemoryDocumentRepository,
      fakeUploader,
      inMemoryOrganizationRepository,
      inMemoryBotRepository,
    );
  });

  it('should upload and register a PDF document', async () => {
    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const document = inMemoryDocumentRepository.items[0];

    expect(result.value).toEqual({ documentId: document.id });
    expect(document).toEqual({
      id: result.value.documentId,
      botId: 'bot-1',
      name: 'bot-knowledge.pdf',
      storageKey: `organizations/organization-1/bots/bot-1/documents/${result.value.documentId}/original.pdf`,
      contentType: 'application/pdf',
      size: pdfBody.byteLength,
      status: 'PENDING',
    });
    expect(fakeUploader.uploads).toEqual([
      {
        key: document.storageKey,
        contentType: 'application/pdf',
        body: pdfBody,
      },
    ]);
  });

  it.each([
    {
      fileName: 'bot-knowledge.txt',
      fileType: 'application/pdf',
    },
    {
      fileName: 'bot-knowledge.pdf',
      fileType: 'text/plain',
    },
  ])('should reject an invalid PDF type', async ({ fileName, fileType }) => {
    const result = await sut.execute({
      ...validRequest(),
      fileName,
      fileType,
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an invalid document type error');
    }

    expect(result.value).toBeInstanceOf(InvalidDocumentTypeError);
    expect(fakeUploader.uploads).toHaveLength(0);
    expect(inMemoryDocumentRepository.items).toHaveLength(0);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 10 * 1024 * 1024 + 1])(
    'should reject an invalid document size: %s',
    async (size) => {
      const result = await sut.execute({ ...validRequest(), size });

      expect(result.isLeft()).toBe(true);

      if (result.isRight()) {
        throw new Error('Expected an invalid document size error');
      }

      expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
      expect(fakeUploader.uploads).toHaveLength(0);
      expect(inMemoryDocumentRepository.items).toHaveLength(0);
    },
  );

  it('should reject content whose length differs from its declared size', async () => {
    const result = await sut.execute({
      ...validRequest(),
      size: pdfBody.byteLength + 1,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected an invalid document size error');
    }
    expect(result.value).toBeInstanceOf(InvalidDocumentSizeError);
    expect(fakeUploader.uploads).toHaveLength(0);
    expect(inMemoryDocumentRepository.items).toHaveLength(0);
  });

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      ...validRequest(),
      organizationSlug: 'missing-organization',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('should reject an organization different from the active one', async () => {
    const result = await sut.execute({
      ...validRequest(),
      activeOrganizationId: 'organization-2',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }

    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('should reject an unknown bot', async () => {
    const result = await sut.execute({
      ...validRequest(),
      botSlug: 'missing-bot',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an unknown bot error');
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(fakeUploader.uploads).toHaveLength(0);
  });

  it('should not create a document when storage upload fails', async () => {
    vi.spyOn(fakeUploader, 'upload').mockRejectedValueOnce(
      new Error('Storage unavailable'),
    );

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Storage unavailable',
    );
    expect(fakeUploader.uploads).toHaveLength(0);
    expect(inMemoryDocumentRepository.items).toHaveLength(0);
  });

  it('should not remove the uploaded object when persistence fails', async () => {
    vi.spyOn(inMemoryDocumentRepository, 'create').mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    await expect(sut.execute(validRequest())).rejects.toThrow(
      'Database unavailable',
    );
    expect(fakeUploader.uploads).toHaveLength(1);
    expect(fakeUploader.deletedKeys).toHaveLength(0);
  });
});
