import { NotAllowedError } from '../../../core/errors/errors/not-allowed-error.js';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository.js';
import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { FetchDataUseCase } from './fetch-data.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeDocument } from '../../../../test/factories/make-document.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';

let documents: InMemoryDocumentRepository;
let organizationMembers: InMemoryOrganizationMemberRepository;
let bots: InMemoryBotRepository;
let sut: FetchDataUseCase;

describe('Fetch data', () => {
  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
    organizationMembers = new InMemoryOrganizationMemberRepository();
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-1'),
        userId: new UniqueEntityId('user-1'),
        role: 'owner',
      }),
      'organization-one',
    );
    organizationMembers.add(
      makeOrganizationMember({
        orgId: new UniqueEntityId('organization-2'),
        userId: new UniqueEntityId('user-2'),
        role: 'owner',
      }),
      'organization-two',
    );
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
    sut = new FetchDataUseCase(documents, organizationMembers, bots);
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
      orgSlug: 'organization-one',
      botSlug: 'a',
      userId: 'user-1',
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(
      result.value.documents.map((document) => document.id.toString()),
    ).toEqual(['document-2', 'document-1']);
  });

  it('should reject an unknown organization slug', async () => {
    const result = await sut.execute({
      orgSlug: 'missing-organization',
      botSlug: 'a',
      userId: 'user-1',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected an unknown organization error');
    }

    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('should reject an organization the user is not a member of', async () => {
    const result = await sut.execute({
      orgSlug: 'organization-two',
      botSlug: 'a',
      userId: 'user-1',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error('Expected a not allowed error');
    }

    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
