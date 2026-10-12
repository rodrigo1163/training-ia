import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

interface UploadBotPdfUseCaseRequest {
  organizationSlug: string;
  botSlug: string;
  activeOrganizationId: string;
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

type UploadBotPdfUseCaseResponse = Either<
  | InvalidDocumentTypeError
  | InvalidDocumentSizeError
  | ResourceNotFoundError
  | NotAllowedError,
  {
    documentId: string;
  }
>;

@Injectable()
export class UploadBotPdfUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly organizationsRepository: OrganizationRepository,
    private readonly botsRepository: BotRepository,
  ) {}

  async execute({
    organizationSlug,
    botSlug,
    activeOrganizationId,
    fileName,
    fileType,
    size,
    body,
  }: UploadBotPdfUseCaseRequest): Promise<UploadBotPdfUseCaseResponse> {
    if (
      fileType !== 'application/pdf' ||
      !fileName.toLowerCase().endsWith('.pdf')
    ) {
      return left(new InvalidDocumentTypeError());
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_PDF_SIZE ||
      body.byteLength !== size
    ) {
      return left(new InvalidDocumentSizeError());
    }

    const organization =
      await this.organizationsRepository.findBySlug(organizationSlug);

    if (!organization) {
      return left(new ResourceNotFoundError());
    }

    if (organization.id !== activeOrganizationId) {
      return left(new NotAllowedError());
    }

    const organizationId = organization.id;
    const bot = await this.botsRepository.findBySlugAndOrganizationId(
      botSlug,
      organizationId,
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documentId = randomUUID();
    const storageKey = `organizations/${organizationId}/bots/${bot.id}/documents/${documentId}/original.pdf`;

    await this.uploader.upload({
      key: storageKey,
      contentType: 'application/pdf',
      body,
    });

    await this.documentsRepository.create({
      id: documentId,
      botId: bot.id,
      name: fileName,
      storageKey,
      contentType: 'application/pdf',
      size,
      status: 'PENDING',
    });

    return right({ documentId });
  }
}
