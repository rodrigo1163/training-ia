import type { ProcessingDocument } from '@/domain/enterprise/entities/processing-document';

export interface CompleteDocumentProcessingInput {
  documentId: string;
  expectedContentVersion: number | null;
  contentVersion: number;
  markdown: string;
  textHash: string;
  chunks: string[];
  vectors: number[][];
  embeddingModel: string;
  embeddingDimensions: number;
}

export abstract class DocumentProcessingRepository {
  abstract findProcessingById(
    id: string,
    expectedContentVersion: number | null,
  ): Promise<ProcessingDocument | null>;

  abstract complete(input: CompleteDocumentProcessingInput): Promise<boolean>;

  abstract markFailed(
    id: string,
    expectedContentVersion: number | null,
  ): Promise<boolean>;
}
