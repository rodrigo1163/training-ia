import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import type { Document } from '../../enterprise/entities/document.js';

interface FetchDataUseCaseRequest {
  organizationSlug: string;
  botSlug: string;
  userId: string;
}

type FetchDataUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { documents: Document[] }
>;

@Injectable()
export class FetchDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly organizationMembers: OrganizationMemberRepository,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    organizationSlug,
    botSlug,
    userId,
  }: FetchDataUseCaseRequest): Promise<FetchDataUseCaseResponse> {
    const organizationMember = await this.organizationMembers.findByOrgSlug(
      organizationSlug,
      userId,
    );

    if (!organizationMember) {
      return left(new NotAllowedError());
    }

    const bot = await this.bots.findBySlugAndOrganizationId(
      botSlug,
      organizationMember.organizationId.toString(),
    );

    if (!bot) return left(new ResourceNotFoundError());

    const documents = await this.documents.findManyByBotId(bot.id.toString());

    return right({ documents });
  }
}
