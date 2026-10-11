import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';
import { Uploader } from '../storage/uploader.js';

interface DeleteManyDataUseCaseRequest {
  organizationSlug: string;
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
  ) {}

  async execute({
    organizationSlug,
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

    const documents = await this.documents.findManyByIdsAndOrganizationId(
      uniqueDocumentIds,
      organization.id,
    );

    if (documents.length !== uniqueDocumentIds.length) {
      return left(new ResourceNotFoundError());
    }

    await Promise.all(
      documents.map((document) =>
        this.storage.deleteObject({ key: document.storageKey }),
      ),
    );

    await this.documents.deleteManyByIdsAndOrganizationId(
      uniqueDocumentIds,
      organization.id,
    );

    return right(null);
  }
}
