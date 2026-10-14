import type { Document } from '../../enterprise/entities/document.js';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details.js';

export abstract class DocumentRepository {
  abstract create(document: Document): Promise<void>;

  abstract createMany(documents: Document[]): Promise<void>;

  abstract findManyByBotId(botId: string): Promise<Document[]>;

  abstract findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<Document | null>;

  abstract findDetailsByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<DocumentDetails | null>;

  abstract findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<Document[]>;

  abstract delete(document: Document): Promise<void>;

  abstract deleteMany(documents: Document[]): Promise<void>;
}
