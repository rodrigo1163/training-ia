import {
  DocumentStorage,
  PresignedUpload,
} from '../storage/presigner-upload.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { CreatePresignedBotPdfUploadUseCase } from './create-presigned-bot-pdf-upload.js';

class FakeDocumentStorage extends DocumentStorage {
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
let documentStorage: FakeDocumentStorage;
let sut: CreatePresignedBotPdfUploadUseCase;

describe('Create presigned bot PDF upload', () => {
  beforeEach(() => {
    documentRepository = new InMemoryDocumentRepository();
    documentStorage = new FakeDocumentStorage();
    sut = new CreatePresignedBotPdfUploadUseCase(
      documentRepository,
      documentStorage,
    );
  });

  it('should create a presigned upload for a PDF document', async () => {
    const result = await sut.execute({
      organizationId: 'organization-1',
      filename: 'bot-knowledge.pdf',
      contentType: 'application/pdf',
      size: 20 * 1024 * 1024,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const document = documentRepository.items[0];

    expect(document).toEqual({
      id: result.value.documentId,
      organizationId: 'organization-1',
      name: 'bot-knowledge.pdf',
      storageKey: `organizations/organization-1/documents/${result.value.documentId}/original.pdf`,
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
    expect(result.value).toEqual({
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
  ])(
    'should reject an invalid PDF type',
    async ({ filename, contentType }) => {
      const result = await sut.execute({
        organizationId: 'organization-1',
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
    },
  );

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 20 * 1024 * 1024 + 1])(
    'should reject an invalid document size: %s',
    async (size) => {
      const result = await sut.execute({
        organizationId: 'organization-1',
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
});
