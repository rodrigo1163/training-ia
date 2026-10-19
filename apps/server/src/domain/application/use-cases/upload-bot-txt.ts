import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { Document } from '../../enterprise/entities/document.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';

const MAX_TXT_SIZE = 10 * 1024 * 1024;

export interface UploadBotTxtRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

export type UploadBotTxtResponse = Either<
  | InvalidDocumentTypeError
  | InvalidDocumentSizeError
  | ResourceNotFoundError,
  { document: Document }
>;

@Injectable()
export class UploadBotTxtUseCase {
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
  }: UploadBotTxtRequest): Promise<UploadBotTxtResponse> {
    if (fileType !== 'text/plain' || !fileName.toLowerCase().endsWith('.txt')) {
      return left(new InvalidDocumentTypeError());
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_TXT_SIZE ||
      body.byteLength !== size
    ) {
      return left(new InvalidDocumentSizeError());
    }

    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) return left(new ResourceNotFoundError());

    const documentId = new UniqueEntityId();
    const storageKey = `${fileName}-${documentId.toString()}.txt`;
    const document = Document.create(
      {
        botId: bot.id,
        name: fileName,
        storageKey,
        contentType: 'text/plain',
        size,
      },
      documentId,
    );

    document.startProcessing();

    await this.uploader.upload({
      key: storageKey,
      contentType: 'text/plain',
      body,
    });
    await this.documentsRepository.create(document);

    return right({ document });
  }
}
