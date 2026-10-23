import type supertest from 'supertest';

export function binaryParser(
  response: supertest.Response,
  callback: (error: Error | null, body: unknown) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on('end', () => callback(null, Buffer.concat(chunks)));
  response.on('error', callback);
}
