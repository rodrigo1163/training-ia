import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { DocumentContent } from '../../enterprise/entities/document-content';
import type { Document } from '../../enterprise/entities/document';
import { BotRepository } from '../repositories/bot-repository';
import { DocumentRepository } from '../repositories/document-repository';
import { InvalidDocumentTextError } from './errors/invalid-document-text-error';

export interface EditDocumentTextUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentId: string;
  markdown: string;
}

type EditDocumentTextUseCaseResponse = Either<
  ResourceNotFoundError | InvalidDocumentTextError,
  { document: Document }
>;

@Injectable()
export class EditDocumentTextUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    documentId,
    markdown,
  }: EditDocumentTextUseCaseRequest): Promise<EditDocumentTextUseCaseResponse> {
    if (markdown.trim().length === 0) {
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

    const documentContent = DocumentContent.create({
      documentId: document.id,
      markdown,
      version: (document.content?.version ?? 0) + 1,
    });

    const textHash = createHash('sha256')
      .update(markdown, 'utf8')
      .digest('hex');

    document.updateContent(documentContent, textHash);
    await this.documents.update(document);

    return right({ document });
  }
}
