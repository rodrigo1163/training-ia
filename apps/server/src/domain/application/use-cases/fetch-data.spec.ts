import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { FetchDataUseCase } from './fetch-data.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

let documents: InMemoryDocumentRepository;
let organizationMember: OrganizationMember;
let bots: InMemoryBotRepository;
let sut: FetchDataUseCase;

describe('Fetch data', () => {
  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    bots = new InMemoryBotRepository();
    bots.items.push(
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'A',
        },
        new UniqueEntityId('bot-1'),
      ),
      makeBot(
        {
          orgId: new UniqueEntityId('organization-1'),
          name: 'B',
        },
        new UniqueEntityId('bot-2'),
      ),
    );
    sut = new FetchDataUseCase(documents, bots);
  });

  it('should fetch only data from a member organization, newest first', async () => {
    documents.items.push(
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'older.pdf',
          updatedAt: new Date('2026-10-10T12:00:00.000Z'),
        },
        new UniqueEntityId('document-1'),
      ),
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'newer.pdf',
          updatedAt: new Date('2026-10-11T12:00:00.000Z'),
        },
        new UniqueEntityId('document-2'),
      ),
      makeDocument(
        {
          botId: new UniqueEntityId('bot-2'),
          name: 'other-bot.pdf',
          updatedAt: new Date('2026-10-12T12:00:00.000Z'),
        },
        new UniqueEntityId('document-3'),
      ),
    );

    const result = await sut.execute({
      organizationMember,
      botSlug: 'a',
      pagination: { page: 1, pageSize: 5 },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(
      result.value.items.map((document) => document.documentId.toString()),
    ).toEqual(['document-2', 'document-1']);
    expect(result.value.totalItems).toBe(2);
    expect(result.value.totalSize).toBe(2048);
  });

  it('should paginate and search documents', async () => {
    documents.items.push(
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'manual.pdf',
          updatedAt: new Date('2026-10-12T12:00:00.000Z'),
        },
        new UniqueEntityId('document-1'),
      ),
      makeDocument(
        {
          botId: new UniqueEntityId('bot-1'),
          name: 'guide.pdf',
          updatedAt: new Date('2026-10-11T12:00:00.000Z'),
        },
        new UniqueEntityId('document-2'),
      ),
    );

    const result = await sut.execute({
      organizationMember,
      botSlug: 'a',
      pagination: { page: 2, pageSize: 1 },
      search: 'pdf',
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.items).toHaveLength(1);
    expect(result.value.items[0]?.name).toBe('guide.pdf');
    expect(result.value.totalItems).toBe(2);
  });

  it('should reject an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      pagination: { page: 1, pageSize: 5 },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a missing bot error');
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
