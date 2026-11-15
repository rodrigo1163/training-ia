import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { makeOrganization } from '../../../../test/factories/make-organization';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { InMemoryOrganizationRepository } from '../../../../test/repositories/in-memory-organization-repository';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import { InvalidAvatarFileError } from './errors/invalid-avatar-file-error';
import { UploadOrganizationLogoUseCase } from './upload-organization-logo';

function makePng(width: number, height: number): Buffer {
  const body = Buffer.alloc(33);
  body.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  return body;
}

describe('Upload organization logo', () => {
  it.each([
    ['an unsupported MIME type', 'image/gif', makePng(128, 128), 33],
    ['an oversized file', 'image/png', makePng(128, 128), 2 * 1024 * 1024 + 1],
    [
      'a body whose size does not match the declared size',
      'image/png',
      makePng(128, 128),
      32,
    ],
  ])('rejects %s before uploading', async (_case, fileType, body, size) => {
    const organizations = new InMemoryOrganizationRepository();
    const uploader = new FakeUploader();
    const organization = makeOrganization(
      {},
      new UniqueEntityId('organization-1'),
    );
    organizations.items.push(organization);
    const organizationMember = makeOrganizationMember({
      orgId: organization.id,
      role: 'member',
    });

    const result = await new UploadOrganizationLogoUseCase(
      organizations,
      uploader,
    ).execute({
      body,
      fileType,
      organizationMember,
      orgSlug: organization.slug,
      size,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAvatarFileError);
    }
    expect(uploader.uploads).toHaveLength(0);
  });

  it('allows a member to upload and saves the public URL on the organization', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const uploader = new FakeUploader();
    const organization = makeOrganization(
      {},
      new UniqueEntityId('organization-1'),
    );
    organizations.items.push(organization);
    const organizationMember = makeOrganizationMember({
      orgId: organization.id,
      role: 'member',
    });
    const body = makePng(128, 128);

    const result = await new UploadOrganizationLogoUseCase(
      organizations,
      uploader,
    ).execute({
      body,
      fileType: 'image/png',
      organizationMember,
      orgSlug: organization.slug,
      size: body.length,
    });

    expect(result.isRight()).toBe(true);
    expect(uploader.uploads[0]).toMatchObject({
      body,
      contentType: 'image/png',
      key: expect.stringMatching(
        /^organization-logos\/organization-1\/[\da-f-]+\.png$/,
      ),
    });
    expect(organization.logo).toContain('organization-logos/organization-1/');
    if (result.isRight()) {
      expect(result.value.logoUrl).toBe(organization.logo);
    }
  });
});
