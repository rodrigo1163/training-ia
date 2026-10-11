import {
  CreateDocumentInput,
  DocumentRepository,
} from '../../src/domain/application/repositories/document-repository.js';

export class InMemoryDocumentRepository implements DocumentRepository {
  public items: CreateDocumentInput[] = [];

  async create(document: CreateDocumentInput): Promise<void> {
    this.items.push(document);
  }
}
