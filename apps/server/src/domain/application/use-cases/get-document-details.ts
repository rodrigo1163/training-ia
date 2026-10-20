import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { DocumentRepository } from '../repositories/document-repository.js';

export interface GetDocumentDetailsUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentId: string;
}

type GetDocumentDetailsUseCaseResponse = Either<
  ResourceNotFoundError,
  { document: DocumentDetails }
>;

@Injectable()
export class GetDocumentDetailsUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    documentId,
  }: GetDocumentDetailsUseCaseRequest): Promise<GetDocumentDetailsUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const document = await this.documents.findDetailsByIdAndBotId(
      documentId,
      bot.id.toString(),
    );

    if (!document) {
      return left(new ResourceNotFoundError());
    }

    return right({ document });
  }
}
