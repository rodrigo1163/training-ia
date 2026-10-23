import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details';
import { BotRepository } from '../repositories/bot-repository';
import { DocumentRepository } from '../repositories/document-repository';
import { Uploader, type DownloadObjectResult } from '../storage/uploader';
import { StorageDownloadError } from './errors/storage-download-error';

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
  ) { }

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
