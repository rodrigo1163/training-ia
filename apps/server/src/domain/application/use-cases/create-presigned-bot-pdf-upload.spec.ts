import { PresignedUpload, Uploader } from '../storage/uploader.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { CreatePresignedBotPdfUploadUseCase } from './create-presigned-bot-pdf-upload.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';

class FakeDocumentStorage extends Uploader {
  public requests: Array<{
    key: string;
    contentType: string;
    expiresIn: number;
  }> = [];

  public readonly expiresAt = new Date('2030-01-01T00:00:00.000Z');

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    expiresIn: number;
  }): Promise<PresignedUpload> {
    this.requests.push(input);

    return {
      url: 'https://storage.example.com/presigned-upload',
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
      },
      expiresAt: this.expiresAt,
    };
  }
}

let documentRepository: InMemoryDocumentRepository;
let organizationRepository: InMemoryOrganizationRepository;
let documentStorage: FakeDocumentStorage;
let sut: CreatePresignedBotPdfUploadUseCase;

describe('Create presigned bot PDF upload', () => {
  beforeEach(() => {
    documentRepository = new InMemoryDocumentRepository();
    organizationRepository = new InMemoryOrganizationRepository();
    organizationRepository.items.push({
      id: 'organization-1',
      slug: 'organization-one',
    });
    documentStorage = new FakeDocumentStorage();
    sut = new CreatePresignedBotPdfUploadUseCase(
      documentRepository,
      documentStorage,
      organizationRepository,
    );
  });

  it('should create a presigned upload for a PDF document', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      filename: 'bot-knowledge.pdf',
      contentType: 'application/pdf',
      size: 20 * 1024 * 1024,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const uploadDocument = result.value.document;
    const document = documentRepository.items[0];

    expect(document).toEqual({
      id: uploadDocument.documentId,
      organizationId: 'organization-1',
      name: 'bot-knowledge.pdf',
      storageKey: `organizations/organization-1/documents/${uploadDocument.documentId}/original.pdf`,
      contentType: 'application/pdf',
      size: 20 * 1024 * 1024,
      status: 'PENDING',
    });
    expect(documentStorage.requests).toEqual([
      {
        key: document.storageKey,
        contentType: 'application/pdf',
        expiresIn: 300,
      },
    ]);
    expect({
      documentId: uploadDocument.documentId,
      uploadUrl: uploadDocument.uploadUrl,
      method: uploadDocument.method,
      headers: uploadDocument.headers,
      expiresAt: uploadDocument.expiresAt,
    }).toEqual({
      documentId: document.id,
      uploadUrl: 'https://storage.example.com/presigned-upload',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      expiresAt: documentStorage.expiresAt,
    });
  });

  it.each([
    {
      filename: 'bot-knowledge.txt',
      contentType: 'application/pdf',
    },
    {
      filename: 'bot-knowledge.pdf',
      contentType: 'text/plain',
    },
  ])('should reject an invalid PDF type', async ({ filename, contentType }) => {
    const result = await sut.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-1',
      filename,
      contentType,
      size: 1024,
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an invalid document type error');
    }

    expect(result.value.message).toBe('Invalid document type');
    expect(documentStorage.requests).toHaveLength(0);
    expect(documentRepository.items).toHaveLength(0);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 20 * 1024 * 1024 + 1])(
    'should reject an invalid document size: %s',
    async (size) => {
      const result = await sut.execute({
        organizationSlug: 'organization-one',
        activeOrganizationId: 'organization-1',
        filename: 'bot-knowledge.pdf',
        contentType: 'application/pdf',
        size,
      });

      expect(result.isLeft()).toBe(true);

      if (result.isRight()) {
        throw new Error('Expected an invalid document size error');
      }

      expect(result.value.message).toBe('Invalid document size');
      expect(documentStorage.requests).toHaveLength(0);
      expect(documentRepository.items).toHaveLength(0);
    },
  );

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      organizationSlug: 'missing-organization',
      activeOrganizationId: 'organization-1',
      filename: 'bot-knowledge.pdf',
      contentType: 'application/pdf',
      size: 1024,
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(documentStorage.requests).toHaveLength(0);
  });

  it('should reject an organization different from the active one', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-one',
      activeOrganizationId: 'organization-2',
      filename: 'bot-knowledge.pdf',
      contentType: 'application/pdf',
      size: 1024,
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }

    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(documentStorage.requests).toHaveLength(0);
  });
});
