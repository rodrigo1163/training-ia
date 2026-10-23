import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DocumentRepository } from '../repositories/document-repository';
import { Uploader } from '../storage/uploader';
import { BotRepository } from '../repositories/bot-repository';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';

interface DeleteDataUseCaseRequest {
  botSlug: string;
  organizationMember: OrganizationMember;
  documentId: string;
}

type DeleteDataUseCaseResponse = Either<
  ResourceNotFoundError,
  null
>;

@Injectable()
export class DeleteDataUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly storage: Uploader,
    private readonly bots: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    documentId,
  }: DeleteDataUseCaseRequest): Promise<DeleteDataUseCaseResponse> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );

    if (!bot) {
      return left(new ResourceNotFoundError());
    }

    const document = await this.documents.findByIdAndBotId(
      documentId,
      bot.id.toString(),
    );

    if (!document) {
      return left(new ResourceNotFoundError());
    }

    await this.storage.deleteObject({ key: document.storageKey });

    await this.documents.delete(document);

    return right(null);
  }
}
