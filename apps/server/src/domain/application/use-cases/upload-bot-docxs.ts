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

export interface UploadBotDocxInput {
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

interface UploadBotDocxsRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  files: UploadBotDocxInput[];
}

export type UploadBotDocxsResponse = Either<
  | InvalidDocumentTypeError
  | InvalidDocumentSizeError
  | ResourceNotFoundError,
  { documentIds: string[] }
>;

@Injectable()
export class UploadBotDocxsUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    files,
  }: UploadBotDocxsRequest): Promise<UploadBotDocxsResponse> {
    for (const file of files) {
      const validationError = this.validateFile(file);

      if (validationError) {
        return left(validationError);
      }
    }

    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documents = files.map((file) => this.createDocument(bot.id, file));
    const uploadedKeys: string[] = [];

    try {
      for (const [index, document] of documents.entries()) {
        await this.uploader.upload({
          key: document.storageKey,
          contentType: document.contentType,
          body: files[index].body,
        });
        uploadedKeys.push(document.storageKey);
      }

      await this.documentsRepository.createMany(documents);
    } catch (error) {
      await Promise.allSettled(
        uploadedKeys.map((key) => this.uploader.deleteObject({ key })),
      );
      throw error;
    }

    return right({
      documentIds: documents.map((document) => document.id.toString()),
    });
  }

  private validateFile(file: UploadBotDocxInput) {
    if (
      file.fileType !== DOCX_CONTENT_TYPE ||
      !file.fileName.toLowerCase().endsWith('.docx')
    ) {
      return new InvalidDocumentTypeError();
    }

    if (
      !Number.isSafeInteger(file.size) ||
      file.size <= 0 ||
      file.size > MAX_DOCX_SIZE ||
      file.body.byteLength !== file.size
    ) {
      return new InvalidDocumentSizeError();
    }

    return null;
  }

  private createDocument(botId: UniqueEntityId, file: UploadBotDocxInput) {
    const documentId = new UniqueEntityId();
    const storageKey = `${file.fileName}-${documentId.toString()}.docx`;
    const document = Document.create(
      {
        botId,
        name: file.fileName,
        storageKey,
        contentType: DOCX_CONTENT_TYPE,
        size: file.size,
      },
      documentId,
    );

    document.startProcessing();

    return document;
  }
}
