import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';
import { Uploader } from '../storage/uploader.js';

interface DeleteDataUseCaseRequest {
  organizationSlug: string;
  activeOrganizationId: string;
  documentId: string;
}

type DeleteDataUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class DeleteDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly organizations: OrganizationRepository,
    private readonly storage: Uploader,
  ) {}

  async execute({
    organizationSlug,
    activeOrganizationId,
    documentId,
  }: DeleteDataUseCaseRequest): Promise<DeleteDataUseCaseResponse> {
    const organization = await this.organizations.findBySlug(organizationSlug);

    if (!organization) {
      return left(new ResourceNotFoundError());
    }

    if (organization.id !== activeOrganizationId) {
      return left(new NotAllowedError());
    }

    const document = await this.documents.findByIdAndOrganizationId(
      documentId,
      organization.id,
    );

    if (!document) {
      return left(new ResourceNotFoundError());
    }

    await this.storage.deleteObject({ key: document.storageKey });

    await this.documents.deleteByIdAndOrganizationId(
      documentId,
      organization.id,
    );

    return right(null);
  }
}
