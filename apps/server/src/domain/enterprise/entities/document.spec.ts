import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { Document } from './document.js';

describe('Document', () => {
  it('should create a document upload entity', () => {
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

    expect(document.documentId).toBe('document-1');
    expect(document.uploadUrl).toBe('https://storage.example.com/upload');
    expect(document.method).toBe('PUT');
    expect(document.headers).toEqual({
      'Content-Type': 'application/pdf',
    });
    expect(document.expiresAt).toBe(expiresAt);
  });

  it('should preserve the provided entity id', () => {
    const id = new UniqueEntityId('document-1');

    const document = Document.create(
      {
        documentId: 'document-1',
        uploadUrl: 'https://storage.example.com/upload',
        method: 'PUT',
        headers: {},
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
      id,
    );

    expect(document.id).toBe(id);
  });
});
