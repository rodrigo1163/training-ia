import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { ChatMessageCitation } from './chat-message-citation.js';

describe('ChatMessageCitation', () => {
  it('creates a citation with nullable references and a timestamp', () => {
    const citation = ChatMessageCitation.create({
      messageId: new UniqueEntityId('message-1'),
      documentName: 'knowledge.pdf',
      excerpt: 'Relevant excerpt',
      position: 0,
      score: 0.92,
    });

    expect(citation.documentId).toBeNull();
    expect(citation.chunkId).toBeNull();
    expect(citation.createdAt).toBeInstanceOf(Date);
  });
});
