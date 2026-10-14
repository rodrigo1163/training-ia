import type { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';

export class DocumentDetailsPresenter {
  static toHTTP(document: DocumentDetails, fileUrl: string) {
    return {
      id: document.documentId.toString(),
      type:
        document.contentType === 'text/plain'
          ? ('TXT' as const)
          : document.contentType === 'text/html'
            ? ('WEBSITE' as const)
            : ('PDF' as const),
      title: document.name,
      url: fileUrl,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
      text: document.text,
    };
  }
}
