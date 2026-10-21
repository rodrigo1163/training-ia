import { DocumentRepository } from '../../src/domain/application/repositories/document-repository.js';
import { DomainEvents } from '@training-ia/core/events/domain-events.js';
import type {
  PaginationParams,
  PaginationResult,
} from '@training-ia/core/repositories/pagination-params.js';
import type { Document } from '../../src/domain/enterprise/entities/document.js';
import type { DocumentContent } from '../../src/domain/enterprise/entities/document-content.js';
import { DocumentDetails } from '../../src/domain/enterprise/value-objects/document-details.js';

export class InMemoryDocumentRepository implements DocumentRepository {
  public items: Document[] = [];
  public contents: DocumentContent[] = [];

  async create(document: Document): Promise<void> {
    this.items.push(document);

    if (document.content) {
      this.contents.push(document.content);
    }
  }

  async createMany(documents: Document[]): Promise<void> {
    for (const document of documents) {
      await this.create(document);
    }

    for (const document of documents) {
      await DomainEvents.dispatchEventsForAggregate(document.id);
    }
  }

  async findManyByBotId(
    botId: string,
    { page, pageSize }: PaginationParams,
    search?: string,
  ): Promise<PaginationResult<DocumentDetails>> {
    const normalizedSearch = search?.trim().toLowerCase();
    const filteredDocuments = this.items
      .filter((document) => document.botId.toString() === botId)
      .filter((document) => {
        if (!normalizedSearch) {
          return true;
        }

        const type =
          document.contentType === 'text/plain'
            ? 'txt'
            : document.contentType === 'text/html'
              ? 'website'
              : 'pdf';
        const status =
          document.status === 'READY'
            ? 'active ready'
            : document.status === 'FAILED'
              ? 'inactive failed'
              : 'processing';

        return `${document.name} ${document.contentType} ${type} ${status}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => {
        const updatedAtDifference =
          b.updatedAt.getTime() - a.updatedAt.getTime();

        return (
          updatedAtDifference || b.id.toString().localeCompare(a.id.toString())
        );
      });

    return {
      items: filteredDocuments
        .slice((page - 1) * pageSize, page * pageSize)
        .map((document) => this.toDocumentDetails(document)),
      totalItems: filteredDocuments.length,
    };
  }

  async getTotalSizeByBotId(botId: string): Promise<number> {
    return this.items
      .filter((document) => document.botId.toString() === botId)
      .reduce((total, document) => total + document.size, 0);
  }

  async findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<Document | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === documentId && item.botId.toString() === botId,
      ) ?? null
    );
  }

  async findDetailsByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<DocumentDetails | null> {
    const document = await this.findByIdAndBotId(documentId, botId);

    if (!document) {
      return null;
    }

    return this.toDocumentDetails(document);
  }

  private toDocumentDetails(document: Document) {
    return DocumentDetails.create({
      documentId: document.id,
      botId: document.botId,
      name: document.name,
      storageKey: document.storageKey,
      contentType: document.contentType,
      size: document.size,
      textHash: document.textHash,
      status: document.status,
      markdown: document.content?.markdown ?? '',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  async update(document: Document): Promise<void> {
    const documentIndex = this.items.findIndex((item) =>
      item.id.equals(document.id),
    );

    if (documentIndex === -1) {
      return;
    }

    this.items[documentIndex] = document;

    const contentIndex = this.contents.findIndex((content) =>
      content.documentId.equals(document.id),
    );

    if (document.content && contentIndex === -1) {
      this.contents.push(document.content);
    } else if (document.content && contentIndex !== -1) {
      this.contents[contentIndex] = document.content;
    }

    await DomainEvents.dispatchEventsForAggregate(document.id);
  }

  async findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<Document[]> {
    return this.items.filter(
      (item) =>
        documentIds.includes(item.id.toString()) &&
        item.botId.toString() === botId,
    );
  }

  async delete(document: Document): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(document.id));
  }

  async deleteMany(documents: Document[]): Promise<void> {
    this.items = this.items.filter(
      (item) => !documents.some((document) => document.id.equals(item.id)),
    );
  }
}
