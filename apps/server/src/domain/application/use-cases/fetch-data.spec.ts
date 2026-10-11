import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository.js';
import { FetchDataUseCase } from './fetch-data.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';

let documents: InMemoryDocumentRepository;
let organizations: InMemoryOrganizationRepository;
let bots: InMemoryBotRepository;
let sut: FetchDataUseCase;

describe('Fetch data', () => {
  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
    organizations = new InMemoryOrganizationRepository();
    organizations.items.push(
      { id: 'organization-1', slug: 'organization-one' },
      { id: 'organization-2', slug: 'organization-two' },
    );
    bots = new InMemoryBotRepository();
    bots.items.push(
      {
        id: 'bot-1',
        organizationId: 'organization-1',
        name: 'A',
        slug: 'a',
        createdAt: new Date(),
        documentCount: 0,
      },
      {
        id: 'bot-2',
        organizationId: 'organization-1',
        name: 'B',
        slug: 'b',
        createdAt: new Date(),
        documentCount: 0,
      },
    );
    sut = new FetchDataUseCase(documents, organizations, bots);
  });

  it('should fetch only data from the active organization, newest first', async () => {
    documents.data.push(
      {
        id: 'document-1',
        botId: 'bot-1',
        name: 'older.pdf',
        contentType: 'application/pdf',
        status: 'PENDING',
        updatedAt: new Date('2026-10-10T12:00:00.000Z'),
      },
      {
        id: 'document-2',
        botId: 'bot-1',
        name: 'newer.pdf',
        contentType: 'application/pdf',
        status: 'PENDING',
        updatedAt: new Date('2026-10-11T12:00:00.000Z'),
      },
      {
        id: 'document-3',
        botId: 'bot-2',
        name: 'other-bot.pdf',
        contentType: 'application/pdf',
        status: 'PENDING',
        updatedAt: new Date('2026-10-12T12:00:00.000Z'),
      },
    );

    const result = await sut.execute({
      organizationSlug: 'organization-one',
      botSlug: 'a',
      activeOrganizationId: 'organization-1',
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.documents.map((document) => document.id)).toEqual([
      'document-2',
      'document-1',
    ]);
  });

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      organizationSlug: 'missing-organization',
      botSlug: 'a',
      activeOrganizationId: 'organization-1',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject an organization different from the active one', async () => {
    const result = await sut.execute({
      organizationSlug: 'organization-two',
      botSlug: 'a',
      activeOrganizationId: 'organization-1',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }

    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
