import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { Document } from '../../enterprise/entities/document';
import { BotRepository } from '../repositories/bot-repository';
import { DocumentRepository } from '../repositories/document-repository';
import { Uploader } from '../storage/uploader';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error';

const DOC_CONTENT_TYPE = 'application/msword';
const DOC_UPLOAD_CONTENT_TYPES = new Set([
  DOC_CONTENT_TYPE,
  'application/octet-stream',
]);
const MAX_DOC_SIZE = 10 * 1024 * 1024;

export interface UploadBotDocRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

export type UploadBotDocResponse = Either<
  InvalidDocumentTypeError | InvalidDocumentSizeError | ResourceNotFoundError,
  { document: Document }
>;

@Injectable()
export class UploadBotDocUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    fileName,
    fileType,
    size,
    body,
  }: UploadBotDocRequest): Promise<UploadBotDocResponse> {
    if (
      !DOC_UPLOAD_CONTENT_TYPES.has(fileType) ||
      !fileName.toLowerCase().endsWith('.doc')
    ) {
      return left(new InvalidDocumentTypeError());
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_DOC_SIZE ||
      body.byteLength !== size
    ) {
      return left(new InvalidDocumentSizeError());
    }

    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documentId = new UniqueEntityId();
    const storageKey = `${fileName}-${documentId.toString()}.doc`;
    const document = Document.create(
      {
        botId: bot.id,
        name: fileName,
        storageKey,
        contentType: DOC_CONTENT_TYPE,
        size,
      },
      documentId,
    );

    document.startProcessing();

    await this.uploader.upload({
      key: storageKey,
      contentType: DOC_CONTENT_TYPE,
      body,
    });
    await this.documentsRepository.create(document);

    return right({ document });
  }
}
