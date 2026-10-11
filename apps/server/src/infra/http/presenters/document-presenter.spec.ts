import { Document } from '@/domain/enterprise/entities/document';
import { DocumentPresenter } from './document-presenter.js';

describe('DocumentPresenter', () => {
  it('should convert a document entity to an HTTP response', () => {
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const document = Document.create({
      documentId: 'document-1',
      uploadUrl: 'https://storage.example.com/upload',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      expiresAt,
    });

    expect(DocumentPresenter.toHTTP(document)).toEqual({
      documentId: 'document-1',
      uploadUrl: 'https://storage.example.com/upload',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      expiresAt,
    });
  });
});
