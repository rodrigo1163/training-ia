import type { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';

export class DocumentDetailsPresenter {
  static toHTTP(document: DocumentDetails, fileUrl: string) {
    return {
      id: document.documentId.toString(),
      type: 'PDF' as const,
      title: document.name,
      url: fileUrl,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
      text: document.text,
    };
  }
}
