import { Document } from '@/domain/enterprise/entities/document';

export class DocumentPresenter {
  static toHTTP(document: Document) {
    return {
      uploadUrl: document.uploadUrl,
      method: document.method,
    };
  }
}
