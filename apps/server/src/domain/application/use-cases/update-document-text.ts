import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentContent } from '../../enterprise/entities/document-content.js';
import type { Document } from '../../enterprise/entities/document.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { InvalidDocumentTextError } from './errors/invalid-document-text-error.js';

export interface UpdateDocumentTextUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentId: string;
  text: string;
}

type UpdateDocumentTextUseCaseResponse = Either<
  ResourceNotFoundError | InvalidDocumentTextError,
  { document: Document }
>;

@Injectable()
export class UpdateDocumentTextUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    documentId,
    text,
  }: UpdateDocumentTextUseCaseRequest): Promise<UpdateDocumentTextUseCaseResponse> {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return left(new InvalidDocumentTextError());
    }

    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const document = await this.documents.findByIdAndBotId(
      documentId,
      bot.id.toString(),
    );

    if (!document) {
      return left(new ResourceNotFoundError());
    }

    const content = DocumentContent.create({
      documentId: document.id,
      text,
      version: (document.content?.version ?? 0) + 1,
    });
    const textHash = createHash('sha256').update(text, 'utf8').digest('hex');

    document.updateContent(content, textHash);
    await this.documents.update(document);

    return right({ document });
  }
}
