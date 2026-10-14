import type { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';

export class DocumentDetailsPresenter {
  private static getTypeAndUrl(
    document: DocumentDetails,
    fileUrl: string,
  ) {
    switch (document.contentType) {
      case 'text/plain':
        return { type: 'TXT' as const, url: fileUrl };
      case 'text/html':
        return { type: 'WEBSITE' as const, url: document.name };
      default:
        return { type: 'PDF' as const, url: fileUrl };
    }
  }

  static toHTTP(document: DocumentDetails, fileUrl: string) {
    const { type, url } = this.getTypeAndUrl(document, fileUrl);

    return {
      id: document.documentId.toString(),
      type,
      title: document.name,
      url,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
      text: document.text,
    };
  }
}
