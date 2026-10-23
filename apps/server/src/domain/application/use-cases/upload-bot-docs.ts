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

export interface UploadBotDocInput {
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

interface UploadBotDocsRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  files: UploadBotDocInput[];
}

export type UploadBotDocsResponse = Either<
  InvalidDocumentTypeError | InvalidDocumentSizeError | ResourceNotFoundError,
  { documentIds: string[] }
>;

@Injectable()
export class UploadBotDocsUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    files,
  }: UploadBotDocsRequest): Promise<UploadBotDocsResponse> {
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

  private validateFile(file: UploadBotDocInput) {
    if (
      !DOC_UPLOAD_CONTENT_TYPES.has(file.fileType) ||
      !file.fileName.toLowerCase().endsWith('.doc')
    ) {
      return new InvalidDocumentTypeError();
    }

    if (
      !Number.isSafeInteger(file.size) ||
      file.size <= 0 ||
      file.size > MAX_DOC_SIZE ||
      file.body.byteLength !== file.size
    ) {
      return new InvalidDocumentSizeError();
    }

    return null;
  }

  private createDocument(botId: UniqueEntityId, file: UploadBotDocInput) {
    const documentId = new UniqueEntityId();
    const storageKey = `${file.fileName}-${documentId.toString()}.doc`;
    const document = Document.create(
      {
        botId,
        name: file.fileName,
        storageKey,
        contentType: DOC_CONTENT_TYPE,
        size: file.size,
      },
      documentId,
    );

    document.startProcessing();

    return document;
  }
}
