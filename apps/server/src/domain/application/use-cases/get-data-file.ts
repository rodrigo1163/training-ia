import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { Uploader, type DownloadObjectResult } from '../storage/uploader.js';
import { StorageDownloadError } from './errors/storage-download-error.js';

export interface GetDataFileUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentId: string;
}

export interface GetDataFileUseCaseOutput {
  document: DocumentDetails;
  file: DownloadObjectResult;
}

type GetDataFileUseCaseResponse = Either<
  ResourceNotFoundError | StorageDownloadError,
  GetDataFileUseCaseOutput
>;

@Injectable()
export class GetDataFileUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly bots: BotRepository,
    private readonly storage: Uploader,
  ) {}

  async execute({
    botSlug,
    organizationMember,
    documentId,
  }: GetDataFileUseCaseRequest): Promise<GetDataFileUseCaseResponse> {
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

    try {
      const file = await this.storage.download({ key: document.storageKey });

      return right({ document, file });
    } catch {
      return left(new StorageDownloadError());
    }
  }
}
