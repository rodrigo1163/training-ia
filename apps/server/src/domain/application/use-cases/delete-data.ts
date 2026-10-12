import { Injectable } from '@nestjs/common';
import { Either, left, right } from '../../../core/either.js';
import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { OrganizationMemberRepository } from '../repositories/organization-member-repository.js';
import { Uploader } from '../storage/uploader.js';
import { BotRepository } from '../repositories/bot-repository.js';

interface DeleteDataUseCaseRequest {
  organizationSlug: string;
  botSlug: string;
  userId: string;
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
    private readonly organizationMembers: OrganizationMemberRepository,
    private readonly storage: Uploader,
    private readonly bots: BotRepository,
  ) {}

  async execute({
    organizationSlug,
    botSlug,
    userId,
    documentId,
  }: DeleteDataUseCaseRequest): Promise<DeleteDataUseCaseResponse> {
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
