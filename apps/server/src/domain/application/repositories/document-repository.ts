export interface CreateDocumentInput {
  id: string;
  organizationId: string;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  status: "PENDING";
}

export abstract class DocumentRepository {
  abstract create(
    document: CreateDocumentInput,
  ): Promise<void>;
}