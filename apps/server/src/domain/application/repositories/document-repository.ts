import type { Document } from '../../enterprise/entities/document.js';

export abstract class DocumentRepository {
  abstract create(document: Document): Promise<void>;

  abstract findManyByBotId(botId: string): Promise<Document[]>;

  abstract findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<Document | null>;

  abstract findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<Document[]>;

  abstract delete(document: Document): Promise<void>;

  abstract deleteMany(documents: Document[]): Promise<void>;
}
