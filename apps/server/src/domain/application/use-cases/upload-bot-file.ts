import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import {
  Document,
  getSupportedDocumentExtension,
} from '../../enterprise/entities/document';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotRepository } from '../repositories/bot-repository';
import { DocumentRepository } from '../repositories/document-repository';
import { Uploader } from '../storage/uploader';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error';

const SUPPORTED_FILE_TYPES_REGEX =
  /^(application\/(pdf|msword|octet-stream|x-cfb)|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DOC_CONTENT_TYPE = 'application/msword';

export interface UploadBotFileRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

export type UploadBotFileResponse = Either<
  InvalidDocumentTypeError | InvalidDocumentSizeError | ResourceNotFoundError,
  { document: Document }
>;

@Injectable()
export class UploadBotFileUseCase {
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
  }: UploadBotFileRequest): Promise<UploadBotFileResponse> {
    if (!SUPPORTED_FILE_TYPES_REGEX.test(fileType)) {
      return left(new InvalidDocumentTypeError());
    }

    const extension = getSupportedDocumentExtension(fileName);
    if (!extension) {
      return left(new InvalidDocumentTypeError());
    }

    const contentType =
      fileType === 'application/octet-stream' ||
      fileType === 'application/x-cfb'
        ? DOC_CONTENT_TYPE
        : fileType;

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_FILE_SIZE ||
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
    const storageKey = `${fileName}-${documentId.toString()}${extension}`;
    const document = Document.create(
      {
        botId: bot.id,
        name: fileName,
        storageKey,
        contentType,
        size,
      },
      documentId,
    );

    document.startProcessing();

    await this.uploader.upload({
      key: storageKey,
      contentType,
      body,
    });
    await this.documentsRepository.create(document);

    return right({ document });
  }
}
