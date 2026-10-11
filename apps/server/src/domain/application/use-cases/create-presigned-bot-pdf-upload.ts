import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { DocumentStorage } from '../storage/presigner-upload.js';

interface CreatePresignedBotPdfUploadUseCaseRequest {
  organizationId: string;
  filename: string;
  contentType: string;
  size: number;
}

type CreatePresignedBotPdfUploadUseCaseResponse = Either<
  Error,
  {
    documentId: string;
    uploadUrl: string;
    method: 'PUT';
    headers: Record<string, string>;
    expiresAt: Date;
  }
>;

@Injectable()
export class CreatePresignedBotPdfUploadUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly storage: DocumentStorage,
  ) {}

  async execute({
    organizationId,
    filename,
    contentType,
    size,
  }: CreatePresignedBotPdfUploadUseCaseRequest): Promise<CreatePresignedBotPdfUploadUseCaseResponse> {
    const maxSize = 20 * 1024 * 1024;

    if (
      contentType !== 'application/pdf' ||
      !filename.toLowerCase().endsWith('.pdf')
    ) {
      return left(new Error('Invalid document type'));
    }

    if (!Number.isSafeInteger(size) || size <= 0 || size > maxSize) {
      return left(new Error('Invalid document size'));
    }

    const documentId = randomUUID();

    const storageKey =
      `organizations/${organizationId}` +
      `/documents/${documentId}/original.pdf`;

    const signedUpload = await this.storage.createPresignedUpload({
      key: storageKey,
      contentType: 'application/pdf',
      expiresIn: 300,
    });

    await this.documents.create({
      id: documentId,
      organizationId,
      name: filename,
      storageKey,
      contentType: 'application/pdf',
      size,
      status: 'PENDING',
    });

    return right({
      documentId,
      uploadUrl: signedUpload.url,
      method: signedUpload.method,
      headers: signedUpload.headers,
      expiresAt: signedUpload.expiresAt,
    });
  }
}
