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

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export interface UploadBotPdfInput {
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

interface UploadBotPdfsUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  files: UploadBotPdfInput[];
}

type UploadBotPdfsUseCaseResponse = Either<
  | InvalidDocumentTypeError
  | InvalidDocumentSizeError
  | ResourceNotFoundError,
  {
    documentIds: string[];
  }
>;

@Injectable()
export class UploadBotPdfsUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    files,
  }: UploadBotPdfsUseCaseRequest): Promise<UploadBotPdfsUseCaseResponse> {
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
      await this.cleanupUploadedObjects(uploadedKeys);
      throw error;
    }

    return right({
      documentIds: documents.map((document) => document.id.toString()),
    });
  }

  private validateFile(file: UploadBotPdfInput) {
    if (
      file.fileType !== 'application/pdf' ||
      !file.fileName.toLowerCase().endsWith('.pdf')
    ) {
      return new InvalidDocumentTypeError();
    }

    if (
      !Number.isSafeInteger(file.size) ||
      file.size <= 0 ||
      file.size > MAX_PDF_SIZE ||
      file.body.byteLength !== file.size
    ) {
      return new InvalidDocumentSizeError();
    }

    return null;
  }

  private createDocument(botId: UniqueEntityId, file: UploadBotPdfInput) {
    const documentId = new UniqueEntityId();
    const storageKey = `${file.fileName}-${documentId.toString()}.pdf`;
    const document = Document.create(
      {
        botId,
        name: file.fileName,
        storageKey,
        contentType: 'application/pdf',
        size: file.size,
        textHash: undefined,
      },
      documentId,
    );

    document.startProcessing();

    return document;
  }

  private async cleanupUploadedObjects(keys: string[]): Promise<void> {
    await Promise.allSettled(
      keys.map((key) => this.uploader.deleteObject({ key })),
    );
  }
}
