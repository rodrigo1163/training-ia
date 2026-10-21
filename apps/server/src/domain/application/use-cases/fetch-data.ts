import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details.js';

interface FetchDataUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
}

type FetchDataUseCaseResponse = Either<
  ResourceNotFoundError,
  { documents: DocumentDetails[]; totalSize: number }
>;

@Injectable()
export class FetchDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
  }: FetchDataUseCaseRequest): Promise<FetchDataUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documents = await this.documents.findManyByBotId(bot.id.toString());
    const totalSize = documents.reduce(
      (total, document) => total + document.size,
      0,
    );

    return right({ documents, totalSize });
  }
}
