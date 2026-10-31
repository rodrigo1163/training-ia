import { InvalidAvatarFileError, inspectAvatarImage } from './avatar-image';

function makePng(width: number, height: number): Buffer {
  const body = Buffer.alloc(33);
  body.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  return body;
}

describe('avatar image inspection', () => {
  it('accepts a real PNG signature and reads its dimensions', () => {
    expect(inspectAvatarImage(makePng(640, 480), 'image/png', 33)).toEqual({
      contentType: 'image/png',
      extension: 'png',
      width: 640,
      height: 480,
    });
  });

  it('rejects a MIME mismatch instead of trusting the extension', () => {
    expect(() =>
      inspectAvatarImage(makePng(100, 100), 'image/jpeg', 33),
    ).toThrow(InvalidAvatarFileError);
  });

  it('accepts images larger than the former 800 × 800 limit', () => {
    expect(
      inspectAvatarImage(makePng(1600, 1200), 'image/png', 33),
    ).toMatchObject({
      width: 1600,
      height: 1200,
    });
  });
});
