import type { Document } from '../../enterprise/entities/document.js';
import type { DocumentDetails } from '../../enterprise/value-objects/document-details.js';
import type {
  PaginationParams,
  PaginationResult,
} from '@training-ia/core/repositories/pagination-params.js';

export abstract class DocumentRepository {
  abstract create(document: Document): Promise<void>;

  abstract createMany(documents: Document[]): Promise<void>;

  abstract findManyByBotId(
    botId: string,
    params: PaginationParams,
    search?: string,
  ): Promise<PaginationResult<DocumentDetails>>;

  abstract getTotalSizeByBotId(botId: string): Promise<number>;

  abstract findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<Document | null>;

  abstract findDetailsByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<DocumentDetails | null>;

  abstract update(document: Document): Promise<void>;

  abstract findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<Document[]>;

  abstract delete(document: Document): Promise<void>;

  abstract deleteMany(documents: Document[]): Promise<void>;
}
