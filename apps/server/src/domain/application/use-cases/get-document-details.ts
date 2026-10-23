import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details';
import { BotRepository } from '../repositories/bot-repository';
import { DocumentRepository } from '../repositories/document-repository';

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
  ) { }

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
