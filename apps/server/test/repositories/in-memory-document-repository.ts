import {
  CreateDocumentInput,
  DocumentData,
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
}
