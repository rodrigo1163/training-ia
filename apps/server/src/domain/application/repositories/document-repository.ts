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

export abstract class DocumentRepository {
  abstract create(document: CreateDocumentInput): Promise<void>;

  abstract findManyByOrganizationId(
    organizationId: string,
  ): Promise<DocumentData[]>;
}
