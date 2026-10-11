import {
  CreateDocumentInput,
  DocumentData,
  DocumentDeletionData,
  DocumentRepository,
} from '../../src/domain/application/repositories/document-repository.js';

export class InMemoryDocumentRepository implements DocumentRepository {
  public items: CreateDocumentInput[] = [];
  public data: DocumentData[] = [];

  async create(document: CreateDocumentInput): Promise<void> {
    this.items.push(document);
    this.data.push({
      id: document.id,
      botId: document.botId,
      name: document.name,
      contentType: document.contentType,
      status: document.status,
      updatedAt: new Date(),
    });
  }

  async findManyByBotId(botId: string): Promise<DocumentData[]> {
    return this.data
      .filter((document) => document.botId === botId)
      .sort((a, b) => {
        const updatedAtDifference =
          b.updatedAt.getTime() - a.updatedAt.getTime();

        return updatedAtDifference || b.id.localeCompare(a.id);
      });
  }

  async findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<DocumentDeletionData | null> {
    const document = this.items.find(
      (item) => item.id === documentId && item.botId === botId,
    );

    if (!document) {
      return null;
    }

    return {
      id: document.id,
      storageKey: document.storageKey,
    };
  }

  async findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<DocumentDeletionData[]> {
    return this.items
      .filter((item) => documentIds.includes(item.id) && item.botId === botId)
      .map((item) => ({
        id: item.id,
        storageKey: item.storageKey,
      }));
  }

  async deleteByIdAndBotId(documentId: string, botId: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === documentId && item.botId === botId),
    );
    this.data = this.data.filter(
      (item) => !(item.id === documentId && item.botId === botId),
    );
  }

  async deleteManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<void> {
    this.items = this.items.filter(
      (item) => !(documentIds.includes(item.id) && item.botId === botId),
    );
    this.data = this.data.filter(
      (item) => !(documentIds.includes(item.id) && item.botId === botId),
    );
  }
}
