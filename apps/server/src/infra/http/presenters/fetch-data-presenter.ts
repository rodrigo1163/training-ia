import type { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';

export class FetchDataPresenter {
  static toHTTP(document: DocumentDetails) {
    return {
      id: document.documentId.toString(),
      type:
        document.contentType === 'text/plain'
          ? ('TXT' as const)
          : document.contentType === 'text/html'
            ? ('WEBSITE' as const)
            : document.contentType === 'application/msword'
              ? ('DOC' as const)
              : document.contentType ===
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ? ('DOCX' as const)
                : ('PDF' as const),
      url: document.name,
      status: document.status,
      size: document.size,
      lastUpdatedAt: document.updatedAt.toISOString(),
    };
  }
}
