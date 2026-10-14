import type { Document } from '@/domain/enterprise/entities/document';

export class FetchDataPresenter {
  static toHTTP(document: Document) {
    return {
      id: document.id.toString(),
      type:
        document.contentType === 'text/plain'
          ? ('TXT' as const)
          : document.contentType === 'text/html'
            ? ('WEBSITE' as const)
            : ('PDF' as const),
      url: document.name,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
    };
  }
}
