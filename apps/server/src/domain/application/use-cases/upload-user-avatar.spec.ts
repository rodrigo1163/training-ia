import { UserProfileUpdater } from '../auth/user-profile-updater';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import { InvalidAvatarFileError } from './avatar-image';
import { UploadUserAvatarUseCase } from './upload-user-avatar';

function makePng(width: number, height: number): Buffer {
  const body = Buffer.alloc(33);
  body.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  return body;
}

class FakeUserProfileUpdater extends UserProfileUpdater {
  public requests: Array<{ image: string; headers: Headers }> = [];

  async updateImage(request: { image: string; headers: Headers }) {
    this.requests.push(request);
    return { headers: new Headers({ 'set-cookie': 'session=updated' }) };
  }
}

describe('Upload user avatar', () => {
  it.each([
    ['an unsupported MIME type', 'image/gif', makePng(128, 128), 33],
    ['an oversized file', 'image/png', makePng(128, 128), 2 * 1024 * 1024 + 1],
    [
      'bytes that do not match the MIME type',
      'image/png',
      Buffer.from('not an image'),
      12,
    ],
  ])(
    'rejects %s before uploading or updating the profile',
    async (_case, fileType, body, size) => {
      const uploader = new FakeUploader();
      const profileUpdater = new FakeUserProfileUpdater();
      const useCase = new UploadUserAvatarUseCase(uploader, profileUpdater);

      const result = await useCase.execute({
        body,
        fileType,
        headers: new Headers(),
        size,
        userId: 'user-1',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value).toBeInstanceOf(InvalidAvatarFileError);
      expect(uploader.uploads).toHaveLength(0);
      expect(profileUpdater.requests).toHaveLength(0);
    },
  );

  it('uploads the validated file and saves its public URL in the user profile', async () => {
    const uploader = new FakeUploader();
    const profileUpdater = new FakeUserProfileUpdater();
    const useCase = new UploadUserAvatarUseCase(uploader, profileUpdater);
    const body = makePng(128, 128);

    const result = await useCase.execute({
      body,
      fileType: 'image/png',
      headers: new Headers({ cookie: 'better-auth.session=token' }),
      size: body.length,
      userId: 'user-1',
    });

    expect(result.isRight()).toBe(true);
    expect(uploader.uploads[0]).toMatchObject({
      body,
      contentType: 'image/png',
      key: expect.stringMatching(/^user-avatars\/user-1\/[\da-f-]+\.png$/),
    });
    expect(profileUpdater.requests[0]).toMatchObject({
      headers: expect.any(Headers),
      image: expect.stringContaining('user-avatars/user-1/'),
    });
    if (result.isRight()) {
      expect(result.value.imageUrl).toBe(profileUpdater.requests[0]?.image);
      expect(result.value.headers.get('set-cookie')).toBe('session=updated');
    }
  });
});
