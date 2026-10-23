import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { makeBot } from '../../../../test/factories/make-bot'
import { makeDocument } from '../../../../test/factories/make-document'
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member'
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository'
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository'
import type { OrganizationMember } from '../../enterprise/entities/organization-member'
import { DocumentContent } from '../../enterprise/entities/document-content'
import { GetDocumentDetailsUseCase } from './get-document-details'

let documents: InMemoryDocumentRepository
let bots: InMemoryBotRepository
let organizationMember: OrganizationMember
let sut: GetDocumentDetailsUseCase

describe('Get document details', () => {
  beforeEach(async () => {
    documents = new InMemoryDocumentRepository()
    bots = new InMemoryBotRepository()
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    })
    bots.items.push(
      makeBot(
        { orgId: new UniqueEntityId('organization-1'), name: 'Support Bot' },
        new UniqueEntityId('bot-1'),
      ),
    )
    sut = new GetDocumentDetailsUseCase(documents, bots)

    const document = makeDocument(
      {
        botId: new UniqueEntityId('bot-1'),
        name: 'knowledge.txt',
        contentType: 'text/plain',
      },
      new UniqueEntityId('document-1'),
    )
    document.content = DocumentContent.create({
      documentId: document.id,
      markdown: '## Documento de conhecimento.',
      version: 1,
    })
    await documents.create(document)
  })

  it('returns the document details for a document from the bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'document-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) throw result.value

    expect(result.value.document.documentId.toString()).toBe('document-1')
    expect(result.value.document.botId.toString()).toBe('bot-1')
    expect(result.value.document.name).toBe('knowledge.txt')
    expect(result.value.document.markdown).toBe('## Documento de conhecimento.')
  })

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      documentId: 'document-1',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isRight()) throw new Error('Expected a missing bot error')
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('rejects an unknown document', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      documentId: 'missing-document',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isRight()) throw new Error('Expected a missing document error')
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
