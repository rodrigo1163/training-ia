import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { Uploader } from '../storage/uploader.js';
import { BotRepository } from '../repositories/bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

interface DeleteManyDataUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentIds: string[];
}

type DeleteManyDataUseCaseResponse = Either<
  ResourceNotFoundError,
  null
>;

@Injectable()
export class DeleteManyDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly storage: Uploader,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    documentIds,
  }: DeleteManyDataUseCaseRequest): Promise<DeleteManyDataUseCaseResponse> {
    const uniqueDocumentIds = [...new Set(documentIds)];

    if (uniqueDocumentIds.length === 0) {
      return left(new ResourceNotFoundError());
    }

    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const documents = await this.documents.findManyByIdsAndBotId(
      uniqueDocumentIds,
      bot.id.toString(),
    );

    if (documents.length !== uniqueDocumentIds.length) {
      return left(new ResourceNotFoundError());
    }

    await Promise.all(
      documents.map((document) =>
        this.storage.deleteObject({ key: document.storageKey }),
      ),
    );

    await this.documents.deleteMany(documents);

    return right(null);
  }
}
