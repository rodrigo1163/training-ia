import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { UploadBotWebsiteUseCase } from './upload-bot-website';

describe('Upload bot website', () => {
  let documents: InMemoryDocumentRepository;
  let bots: InMemoryBotRepository;
  let uploader: FakeUploader;
  let organizationMember: OrganizationMember;
  let sut: UploadBotWebsiteUseCase;

  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
    bots = new InMemoryBotRepository();
    uploader = new FakeUploader();
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
    sut = new UploadBotWebsiteUseCase(documents, uploader, bots);
  });

  it('fetches, extracts, stores and registers a website', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '<html><body><h1>Site title</h1><p>Useful text</p></body></html>',
          {
            headers: { 'content-type': 'text/html; charset=utf-8' },
            status: 200,
          },
        ),
      ),
    );

    const result = await sut.execute({
      botSlug: 'support-bot',
      organizationMember,
      url: 'https://example.com/docs',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;

    const document = result.value.document;
    expect(document.name).toBe('https://example.com/docs');
    expect(document.contentType).toBe('text/html');
    expect(uploader.uploads[0]?.contentType).toBe('text/html');
    expect(uploader.uploads[0]?.body.toString()).toContain('Site title');
  });

});
