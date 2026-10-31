export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

export type AvatarImageInfo = {
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  extension: 'png' | 'jpg' | 'webp';
  width: number;
  height: number;
};

export class InvalidAvatarFileError extends Error {
  constructor(message = 'The avatar file is invalid.') {
    super(message);
  }
}

function isPng(body: Buffer): boolean {
  return (
    body.length >= 33 &&
    body
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    body.readUInt32BE(8) === 13 &&
    body.toString('ascii', 12, 16) === 'IHDR'
  );
}

function readPngInfo(body: Buffer): AvatarImageInfo | null {
  if (!isPng(body)) return null;

  return {
    contentType: 'image/png',
    extension: 'png',
    width: body.readUInt32BE(16),
    height: body.readUInt32BE(20),
  };
}

function readJpegInfo(body: Buffer): AvatarImageInfo | null {
  if (body.length < 4 || body[0] !== 0xff || body[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 4 <= body.length) {
    if (body[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = body[offset + 1];
    offset += 2;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda || offset + 2 > body.length) break;

    const segmentLength = body.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > body.length) break;

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame && segmentLength >= 7) {
      return {
        contentType: 'image/jpeg',
        extension: 'jpg',
        height: body.readUInt16BE(offset + 3),
        width: body.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function readWebpInfo(body: Buffer): AvatarImageInfo | null {
  if (
    body.length < 30 ||
    body.toString('ascii', 0, 4) !== 'RIFF' ||
    body.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  const chunk = body.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    if (
      body.length < 30 ||
      body[23] !== 0x9d ||
      body[24] !== 0x01 ||
      body[25] !== 0x2a
    ) {
      return null;
    }

    return {
      contentType: 'image/webp',
      extension: 'webp',
      width: body.readUInt16LE(26) & 0x3fff,
      height: body.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === 'VP8L' && body[20] === 0x2f && body.length >= 25) {
    const width = 1 + (body[21] | ((body[22] & 0x3f) << 8));
    const height =
      1 + ((body[22] >> 6) | (body[23] << 2) | ((body[24] & 0x0f) << 10));

    return { contentType: 'image/webp', extension: 'webp', width, height };
  }

  if (chunk === 'VP8X' && body.length >= 30) {
    const width = 1 + body[24] + (body[25] << 8) + (body[26] << 16);
    const height = 1 + body[27] + (body[28] << 8) + (body[29] << 16);

    return { contentType: 'image/webp', extension: 'webp', width, height };
  }

  return null;
}

export function inspectAvatarImage(
  body: Buffer,
  declaredType: string,
  size: number,
): AvatarImageInfo {
  if (
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > MAX_AVATAR_FILE_SIZE ||
    body.byteLength !== size
  ) {
    throw new InvalidAvatarFileError('Avatar files must be at most 2 MB.');
  }

  const normalizedDeclaredType =
    declaredType === 'image/jpg' ? 'image/jpeg' : declaredType;
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(normalizedDeclaredType)
  ) {
    throw new InvalidAvatarFileError(
      'Avatar must be a PNG, JPG, JPEG, or WebP image.',
    );
  }

  const info = readPngInfo(body) ?? readJpegInfo(body) ?? readWebpInfo(body);
  if (!info || info.contentType !== normalizedDeclaredType) {
    throw new InvalidAvatarFileError(
      'The avatar content does not match its MIME type.',
    );
  }

  if (
    !Number.isSafeInteger(info.width) ||
    !Number.isSafeInteger(info.height) ||
    info.width <= 0 ||
    info.height <= 0
  ) {
    throw new InvalidAvatarFileError('The avatar dimensions are invalid.');
  }

  return info;
}
