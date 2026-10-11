import type { DocumentData } from '@/domain/application/repositories/document-repository';

export class FetchDataPresenter {
  static toHTTP(document: DocumentData) {
    return {
      id: document.id,
      type: 'PDF' as const,
      url: document.name,
      status: document.status,
      lastUpdatedAt: document.updatedAt.toISOString(),
    };
  }
}
