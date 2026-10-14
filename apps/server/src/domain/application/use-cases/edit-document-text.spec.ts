import { createHash } from 'node:crypto';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { DocumentContent } from '../../enterprise/entities/document-content.js';
import { InvalidDocumentTextError } from './errors/invalid-document-text-error.js';
import { EditDocumentTextUseCase } from './edit-document-text.js';

let documents: InMemoryDocumentRepository;
let bots: InMemoryBotRepository;
let organizationMember: OrganizationMember;
let sut: EditDocumentTextUseCase;

describe('Edit document text', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository();
    bots = new InMemoryBotRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    bots.items.push(
      makeBot(
        { orgId: new UniqueEntityId('organization-1'), name: 'Support Bot' },
        new UniqueEntityId('bot-1'),
      ),
    );
    sut = new EditDocumentTextUseCase(documents, bots);

    const document = makeDocument(
      {
        botId: new UniqueEntityId('bot-1'),
        textHash: 'old-hash',
      },
      new UniqueEntityId('document-1'),
    );
    document.content = DocumentContent.create({
      documentId: document.id,
      text: 'Texto antigo.',
      version: 1,
    });
    await documents.create(document);
  });

  it('edits the document text and increments its version', async () => {
    const text = 'Texto atualizado.';

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'document-1',
      text,
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    const document = result.value.document;
    expect(document.content?.text).toBe(text);
    expect(document.content?.version).toBe(2);
    expect(document.textHash).toBe(
      createHash('sha256').update(text, 'utf8').digest('hex'),
    );
    expect(documents.items[0]?.content?.text).toBe(text);
  });

  it('rejects empty text before changing the document', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'document-1',
      text: '  ',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an invalid text error');
    expect(result.value).toBeInstanceOf(InvalidDocumentTextError);
    expect(documents.items[0]?.content?.text).toBe('Texto antigo.');
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      documentId: 'document-1',
      text: 'Texto atualizado.',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejects an unknown document', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'missing-document',
      text: 'Texto atualizado.',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing document error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
