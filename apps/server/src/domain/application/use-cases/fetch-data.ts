import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type {
  PaginationParams,
  PaginationResult,
} from '@/core/repositories/pagination-params';
import { DocumentRepository } from '../repositories/document-repository';
import { BotRepository } from '../repositories/bot-repository';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details';

interface FetchDataUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  pagination: PaginationParams;
  search?: string;
}

type FetchDataUseCaseResponse = Either<
  ResourceNotFoundError,
  PaginationResult<DocumentDetails> & {
    totalSize: number;
  }
>;

@Injectable()
export class FetchDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    pagination,
    search,
  }: FetchDataUseCaseRequest): Promise<FetchDataUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const [paginatedDocuments, totalSize] = await Promise.all([
      this.documents.findManyByBotId(bot.id.toString(), pagination, search),
      this.documents.getTotalSizeByBotId(bot.id.toString()),
    ]);

    return right({
      ...paginatedDocuments,
      totalSize,
    });
  }
}
