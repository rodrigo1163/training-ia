import { FileTypeValidator } from '@nestjs/common';

describe('TXT file type validation', () => {
  it('accepts plain text files without a recognizable magic number', async () => {
    const validator = new FileTypeValidator({
      fileType: /^text\/plain$/,
      fallbackToMimetype: true,
    });

    await expect(
      validator.isValid({
        mimetype: 'text/plain',
        buffer: Buffer.from('plain text'),
      } as Express.Multer.File),
    ).resolves.toBe(true);
  });
});
