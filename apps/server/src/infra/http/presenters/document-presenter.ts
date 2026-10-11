import { Document } from '@/domain/enterprise/entities/document';

export class DocumentPresenter {
  static toHTTP(document: Document) {
    return {
      documentId: document.documentId,
      uploadUrl: document.uploadUrl,
      method: document.method,
      headers: document.headers,
      expiresAt: document.expiresAt,
    };
  }
}
