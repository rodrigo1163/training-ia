import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';
import { Uploader } from '../storage/uploader.js';
import { BotRepository } from '../repositories/bot-repository.js';

interface DeleteManyDataUseCaseRequest {
  organizationSlug: string;
  botSlug: string;
  activeOrganizationId: string;
  documentIds: string[];
}

type DeleteManyDataUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class DeleteManyDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly organizations: OrganizationRepository,
    private readonly storage: Uploader,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    organizationSlug,
    botSlug,
    activeOrganizationId,
    documentIds,
  }: DeleteManyDataUseCaseRequest): Promise<DeleteManyDataUseCaseResponse> {
    const organization = await this.organizations.findBySlug(organizationSlug);

    if (!organization) {
      return left(new ResourceNotFoundError());
    }

    if (organization.id !== activeOrganizationId) {
      return left(new NotAllowedError());
    }

    const uniqueDocumentIds = [...new Set(documentIds)];

    if (uniqueDocumentIds.length === 0) {
      return left(new ResourceNotFoundError());
    }

    const bot = await this.bots.findBySlugAndOrganizationId(
      botSlug,
      organization.id,
    );

    if (!bot) return left(new ResourceNotFoundError());

    const documents = await this.documents.findManyByIdsAndBotId(
      uniqueDocumentIds,
      bot.id,
    );

    if (documents.length !== uniqueDocumentIds.length) {
      return left(new ResourceNotFoundError());
    }

    await Promise.all(
      documents.map((document) =>
        this.storage.deleteObject({ key: document.storageKey }),
      ),
    );

    await this.documents.deleteManyByIdsAndBotId(uniqueDocumentIds, bot.id);

    return right(null);
  }
}
