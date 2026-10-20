import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@training-ia/core/either.js';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error.js';
import { Document } from '../../enterprise/entities/document.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentRepository } from '../repositories/document-repository.js';
import { BotRepository } from '../repositories/bot-repository.js';
import { Uploader } from '../storage/uploader.js';
import { InvalidDocumentSizeError } from './errors/invalid-document-size-error.js';
import { WebsiteFetchError } from './errors/website-fetch-error.js';

const MAX_WEBSITE_SIZE = 10 * 1024 * 1024;
const WEBSITE_FETCH_TIMEOUT_MS = 15_000;

type UploadBotWebsiteError =
  | InvalidDocumentSizeError
  | WebsiteFetchError
  | ResourceNotFoundError;

@Injectable()
export class UploadBotWebsiteUseCase {
  constructor(
    private readonly documentsRepository: DocumentRepository,
    private readonly uploader: Uploader,
    private readonly botsRepository: BotRepository,
  ) { }

  async execute({
    botSlug,
    organizationMember,
    url,
  }: {
    botSlug: string;
    organizationMember: OrganizationMember;
    url: string;
  }): Promise<Either<UploadBotWebsiteError, { document: Document }>> {
    const bot = await this.botsRepository.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    let html: string;
    try {
      const response = await fetch(url, {
        headers: { accept: 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(WEBSITE_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) return left(new WebsiteFetchError());

      const contentLength = Number(response.headers.get('content-length'));

      if (Number.isFinite(contentLength) && contentLength > MAX_WEBSITE_SIZE) {
        return left(new InvalidDocumentSizeError());
      }

      html = await response.text();
    } catch {
      return left(new WebsiteFetchError());
    }

    const body = Buffer.from(html, 'utf8');

    if (body.byteLength === 0 || body.byteLength > MAX_WEBSITE_SIZE) {
      return left(new InvalidDocumentSizeError());
    }

    const documentId = new UniqueEntityId();
    const storageKey = `website-${documentId.toString()}.html`;
    const document = Document.create(
      {
        botId: bot.id,
        name: url,
        storageKey,
        contentType: 'text/html',
        size: body.byteLength,
      },
      documentId,
    );

    document.startProcessing();

    await this.uploader.upload({
      key: storageKey,
      contentType: 'text/html',
      body,
    });

    await this.documentsRepository.create(document);

    return right({ document });
  }

}
