export interface CreateDocumentInput {
  id: string;
  organizationId: string;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  status: 'PENDING';
}

export interface DocumentData {
  id: string;
  organizationId: string;
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

  abstract findManyByOrganizationId(
    organizationId: string,
  ): Promise<DocumentData[]>;

  abstract findByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<DocumentDeletionData | null>;

  abstract findManyByIdsAndOrganizationId(
    documentIds: string[],
    organizationId: string,
  ): Promise<DocumentDeletionData[]>;

  abstract deleteByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<void>;

  abstract deleteManyByIdsAndOrganizationId(
    documentIds: string[],
    organizationId: string,
  ): Promise<void>;
}
