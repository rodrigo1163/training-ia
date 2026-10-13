import { DocumentRepository } from '../../src/domain/application/repositories/document-repository.js';
import type { Document } from '../../src/domain/enterprise/entities/document.js';
import type { DocumentContent } from '../../src/domain/enterprise/entities/document-content.js';

export class InMemoryDocumentRepository implements DocumentRepository {
  public items: Document[] = [];
  public contents: DocumentContent[] = [];

  async create(document: Document): Promise<void> {
    this.items.push(document);

    if (document.content) {
      this.contents.push(document.content);
    }
  }

  async findManyByBotId(botId: string): Promise<Document[]> {
    return this.items
      .filter((document) => document.botId.toString() === botId)
      .sort((a, b) => {
        const updatedAtDifference =
          b.updatedAt.getTime() - a.updatedAt.getTime();

        return (
          updatedAtDifference || b.id.toString().localeCompare(a.id.toString())
        );
      });
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
