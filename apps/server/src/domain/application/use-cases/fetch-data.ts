import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import {
  DocumentData,
  DocumentRepository,
} from '../repositories/document-repository.js';
import { OrganizationRepository } from '../repositories/organization-repository.js';

interface FetchDataUseCaseRequest {
  organizationSlug: string;
  activeOrganizationId: string;
}

type FetchDataUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { documents: DocumentData[] }
>;

@Injectable()
export class FetchDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute({
    organizationSlug,
    activeOrganizationId,
  }: FetchDataUseCaseRequest): Promise<FetchDataUseCaseResponse> {
    const organization = await this.organizations.findBySlug(organizationSlug);

    if (!organization) {
      return left(new ResourceNotFoundError());
    }

    if (organization.id !== activeOrganizationId) {
      return left(new NotAllowedError());
    }

    const documents = await this.documents.findManyByOrganizationId(
      organization.id,
    );

    return right({ documents });
  }
}
