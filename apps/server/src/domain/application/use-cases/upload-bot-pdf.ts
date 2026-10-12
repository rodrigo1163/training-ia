import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';
import { Document } from '../../enterprise/entities/document.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

interface UploadBotPdfUseCaseRequest {
  orgSlug: string;
  botSlug: string;
  userId: string;
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
    document: Document;
  }
>;

@Injectable()
export class UploadBotPdfUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly organizationMembersRepository: OrganizationMemberRepository,
    private readonly botsRepository: BotRepository,
  ) {}

  async execute({
    orgSlug,
    botSlug,
    userId,
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

    const organizationMember =
      await this.organizationMembersRepository.findByOrgSlugAndUserId(
        orgSlug,
        userId,
      );

    if (!organizationMember) {
      return left(new NotAllowedError());
    }

    const orgId = organizationMember.orgId.toString();
    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      orgId,
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documentId = new UniqueEntityId();
    const storageKey = `organizations/${orgId}/bots/${bot.id.toString()}/documents/${documentId.toString()}/original.pdf`;
    const document = Document.create(
      {
        botId: bot.id,
        name: fileName,
        storageKey,
        contentType: 'application/pdf',
        size,
      },
      documentId,
    );

    await this.uploader.upload({
      key: storageKey,
      contentType: 'application/pdf',
      body,
    });

    await this.documentsRepository.create(document);

    return right({ document });
  }
}
