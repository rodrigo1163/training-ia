import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { makeBot } from '../../../../test/factories/make-bot';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member';
import { FakeUploader } from '../../../../test/storage/fake-uploader';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { UploadBotAvatarUseCase } from './upload-bot-avatar';

function makePng(width: number, height: number): Buffer {
  const body = Buffer.alloc(33);
  body.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  return body;
}

describe('Upload bot avatar', () => {
  it('stores a unique avatar and removes the previous object after saving', async () => {
    const bots = new InMemoryBotRepository();
    const uploader = new FakeUploader();
    const organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
    });
    const bot = makeBot(
      {
        orgId: organizationMember.orgId,
        name: 'Support Bot',
        chatConfig: {
          ...makeBot().chatConfig,
          avatarStorageKey: 'chat-avatars/bot-1/old-avatar.webp',
        },
        style: {
          ...makeBot().style,
          avatarUrl: 'https://storage.example/old-avatar.webp',
        },
      },
      new UniqueEntityId('bot-1'),
    );
    await bots.create(bot);

    const result = await new UploadBotAvatarUseCase(bots, uploader).execute({
      organizationMember,
      botSlug: 'support-bot',
      fileType: 'image/png',
      size: 33,
      body: makePng(128, 128),
    });

    expect(result.isRight()).toBe(true);
    expect(uploader.uploads[0]).toMatchObject({
      contentType: 'image/png',
      body: makePng(128, 128),
    });
    expect(uploader.uploads[0]?.key).toMatch(
      /^chat-avatars\/bot-1\/[\da-f--]+\.png$/,
    );
    expect(uploader.deletedKeys).toEqual([
      'chat-avatars/bot-1/old-avatar.webp',
    ]);
    expect(bots.items[0]?.chatConfig).toMatchObject({
      avatarStorageKey: uploader.uploads[0]?.key,
    });
    expect(bots.items[0]?.style.avatarUrl).toBe(
      `https://storage.example/${uploader.uploads[0]?.key}`,
    );
  });
});
