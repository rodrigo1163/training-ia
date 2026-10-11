import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Document } from '../../enterprise/entities/document.js';
import { Either, left, right } from '../../../core/either.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { Uploader } from '../storage/uploader.js';

interface CreatePresignedBotPdfUploadUseCaseRequest {
  organizationId: string;
  filename: string;
  contentType: string;
  size: number;
}

type CreatePresignedBotPdfUploadUseCaseResponse = Either<
  Error,
  {
    document: Document
  }
>;

@Injectable()
export class CreatePresignedBotPdfUploadUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly storage: Uploader,
  ) { }

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

    const document = Document.create({
      documentId,
      uploadUrl: signedUpload.url,
      method: signedUpload.method,
      headers: signedUpload.headers,
      expiresAt: signedUpload.expiresAt,
    })

    return right({
      document
    });
  }
}
