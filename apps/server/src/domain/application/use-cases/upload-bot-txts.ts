import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { Document } from '../../enterprise/entities/document.js';
import { DocumentContent } from '../../enterprise/entities/document-content.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { InvalidDocumentTextError } from './errors/invalid-document-text-error.js';
import { InvalidDocumentTypeError } from './errors/invalid-document-type-error.js';

const MAX_TXT_SIZE = 10 * 1024 * 1024;

export interface UploadBotTxtInput {
  fileName: string;
  fileType: string;
  size: number;
  body: Buffer;
  text: string;
}

@Injectable()
export class UploadBotTxtsUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) {}

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
      if (typeof file.text !== 'string' || file.text.trim().length === 0) {
        return left(new InvalidDocumentTextError());
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
          textHash: createHash('sha256')
            .update(file.text, 'utf8')
            .digest('hex'),
        },
        documentId,
      );
      document.content = DocumentContent.create({
        documentId,
        text: file.text,
        version: 1,
      });
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
