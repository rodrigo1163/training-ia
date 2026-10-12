import type { Document } from '@/domain/enterprise/entities/document';

export class FetchDataPresenter {
  static toHTTP(document: Document) {
    return {
      id: document.id.toString(),
      type: 'PDF' as const,
      url: document.name,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
    };
  }
}
