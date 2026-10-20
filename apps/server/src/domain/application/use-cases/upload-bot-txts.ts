import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { Document } from '../../enterprise/entities/document.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';

const MAX_TXT_SIZE = 10 * 1024 * 1024;

export interface UploadBotTxtInput {
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
}

@Injectable()
export class UploadBotTxtsUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    files,
  }: {
    botSlug: string;
    organizationMember: OrganizationMember;
    files: UploadBotTxtInput[];
  }): Promise<Either<Error, { documentIds: string[] }>> {
    for (const file of files) {
      if (
        file.fileType !== 'text/plain' ||
        !file.fileName.toLowerCase().endsWith('.txt')
      ) {
        return left(new InvalidDocumentTypeError());
      }
      if (
        !Number.isSafeInteger(file.size) ||
        file.size <= 0 ||
        file.size > MAX_TXT_SIZE ||
        file.body.byteLength !== file.size
      ) {
        return left(new InvalidDocumentSizeError());
      }
    }

    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    const documents = files.map((file) => {
      const documentId = new UniqueEntityId();
      const document = Document.create(
        {
          botId: bot.id,
          name: file.fileName,
          storageKey: `${file.fileName}-${documentId.toString()}.txt`,
          contentType: 'text/plain',
          size: file.size,
        },
        documentId,
      );

      document.startProcessing();
      return document;
    });

    const uploadedKeys: string[] = [];
    try {
      for (const [index, document] of documents.entries()) {
        await this.uploader.upload({
          key: document.storageKey,
          contentType: 'text/plain',
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
}
