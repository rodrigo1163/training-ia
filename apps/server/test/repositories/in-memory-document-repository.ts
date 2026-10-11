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
      organizationId: document.organizationId,
      name: document.name,
      contentType: document.contentType,
      status: document.status,
      updatedAt: new Date(),
    });
  }

  async findManyByOrganizationId(
    organizationId: string,
  ): Promise<DocumentData[]> {
    return this.data
      .filter((document) => document.organizationId === organizationId)
      .sort((a, b) => {
        const updatedAtDifference =
          b.updatedAt.getTime() - a.updatedAt.getTime();

        return updatedAtDifference || b.id.localeCompare(a.id);
      });
  }

  async findByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<DocumentDeletionData | null> {
    const document = this.items.find(
      (item) =>
        item.id === documentId && item.organizationId === organizationId,
    );

    if (!document) {
      return null;
    }

    return {
      id: document.id,
      storageKey: document.storageKey,
    };
  }

  async deleteByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(item.id === documentId && item.organizationId === organizationId),
    );
    this.data = this.data.filter(
      (item) =>
        !(item.id === documentId && item.organizationId === organizationId),
    );
  }
}
