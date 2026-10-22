import { ProcessingDocument } from './processing-document.js';

describe('ProcessingDocument', () => {
  it('exposes the processing projection state', () => {
    const document = new ProcessingDocument({
      id: 'document-1',
      botId: 'bot-1',
      storageKey: 'documents/document-1.pdf',
      contentType: 'application/pdf',
      content: {
        markdown: '# Document',
        version: 2,
      },
    });

    expect(document.id).toBe('document-1');
    expect(document.botId).toBe('bot-1');
    expect(document.content?.version).toBe(2);
  });
});
