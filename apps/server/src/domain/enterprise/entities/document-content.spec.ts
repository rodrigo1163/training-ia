import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { DocumentContent } from './document-content.js';

describe('DocumentContent', () => {
  it('creates the first version with a processing timestamp', () => {
    const documentId = new UniqueEntityId('document-1');

    const content = DocumentContent.create({
      documentId,
      text: 'Document text',
      content: { format: 'plain-text', value: 'Document text' },
      version: 1,
    });

    expect(content.id).toEqual(documentId);
    expect(content.documentId).toEqual(documentId);
    expect(content.text).toBe('Document text');
    expect(content.version).toBe(1);
    expect(content.processedAt).toBeInstanceOf(Date);
  });
});
