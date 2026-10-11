export interface CreateDocumentInput {
  id: string;
  botId: string;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  status: 'PENDING';
}

export interface DocumentData {
  id: string;
  botId: string;
  name: string;
  contentType: string;
  status: 'PENDING';
  updatedAt: Date;
}

export interface DocumentDeletionData {
  id: string;
  storageKey: string;
}

export abstract class DocumentRepository {
  abstract create(document: CreateDocumentInput): Promise<void>;

  abstract findManyByBotId(botId: string): Promise<DocumentData[]>;

  abstract findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<DocumentDeletionData | null>;

  abstract findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<DocumentDeletionData[]>;

  abstract deleteByIdAndBotId(documentId: string, botId: string): Promise<void>;

  abstract deleteManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<void>;
}
