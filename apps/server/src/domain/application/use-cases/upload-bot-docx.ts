import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { Document } from '../../enterprise/entities/document.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_DOCX_SIZE = 10 * 1024 * 1024;

export interface UploadBotDocxRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

export type UploadBotDocxResponse = Either<
  | InvalidDocumentTypeError
  | InvalidDocumentSizeError
  | ResourceNotFoundError,
  { document: Document }
>;

@Injectable()
export class UploadBotDocxUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    fileName,
    fileType,
    size,
    body,
  }: UploadBotDocxRequest): Promise<UploadBotDocxResponse> {
    if (
      fileType !== DOCX_CONTENT_TYPE ||
      !fileName.toLowerCase().endsWith('.docx')
    ) {
      return left(new InvalidDocumentTypeError());
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_DOCX_SIZE ||
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
    const storageKey = `${fileName}-${documentId.toString()}.docx`;
    const document = Document.create(
      {
        botId: bot.id,
        name: fileName,
        storageKey,
        contentType: DOCX_CONTENT_TYPE,
        size,
      },
      documentId,
    );

    document.startProcessing();

    await this.uploader.upload({
      key: storageKey,
      contentType: DOCX_CONTENT_TYPE,
      body,
    });
    await this.documentsRepository.create(document);

    return right({ document });
  }
}
