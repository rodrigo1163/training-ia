import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { InMemoryDocumentRepository } from '../../../../test/repositories/in-memory-document-repository';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { UploadBotFileUseCase } from './upload-bot-file';

const docxContentType =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('Upload bot file', () => {
  let documents: InMemoryDocumentRepository;
  let bots: InMemoryBotRepository;
  let uploader: FakeUploader;
  let organizationMember: OrganizationMember;
  let sut: UploadBotFileUseCase;

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

    sut = new UploadBotFileUseCase(documents, uploader, bots);
  });

  it.each([
    ['document.pdf', 'application/pdf', 'application/pdf', '.pdf'],
    ['document.doc', 'application/msword', 'application/msword', '.doc'],
    ['document.doc', 'application/x-cfb', 'application/msword', '.doc'],
    ['document.docx', docxContentType, docxContentType, '.docx'],
    ['document.txt', 'text/plain', 'text/plain', '.txt'],
  ])(
    'uploads a supported %s file',
    async (fileName, fileType, contentType, extension) => {
      const body = Buffer.from(`file contents for ${extension}`);
      const result = await sut.execute({
        organizationMember,
        botSlug: 'support-bot',
        fileName,
        fileType,
        size: body.byteLength,
        body,
      });

      expect(result.isRight()).toBe(true);
      if (result.isLeft()) {
        throw result.value;
      }

      expect(result.value.document.name).toBe(fileName);
      expect(result.value.document.contentType).toBe(contentType);
      expect(result.value.document.storageKey).toContain(`${fileName}-`);
      expect(uploader.uploads).toHaveLength(1);
      expect(uploader.uploads[0]?.contentType).toBe(contentType);
    },
  );

  it('rejects an unknown bot', async () => {
    const body = Buffer.from('valid body');
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      fileName: 'document.txt',
      fileType: 'text/plain',
      size: body.byteLength,
      body,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a resource not found error');
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
