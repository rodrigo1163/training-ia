import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { PrismaService } from '../../../src/infra/database/prisma/prisma.service.js';
import type { R2TestStorage } from './r2-test-storage.js';
import type request from 'supertest';

type TestAgent = ReturnType<typeof request.agent>;

const pdfFileName = 'bot.pdf';
const pdfFilePath = resolve(process.cwd(), 'test/e2e/fixtures', pdfFileName);

export async function readPdfFixture(): Promise<Buffer> {
  return readFile(pdfFilePath);
}

interface UploadPdfInput {
  agent: TestAgent;
  botSlug: string;
  organizationSlug: string;
  prisma: PrismaService;
  storage: R2TestStorage;
}

export interface UploadedPdfFixture {
  body: Buffer;
  documentId: string;
  fileName: string;
  storageKey: string;
}

export async function uploadPdfFixture({
  agent,
  botSlug,
  organizationSlug,
  prisma,
  storage,
}: UploadPdfInput): Promise<UploadedPdfFixture> {
  const body = await readPdfFixture();
  const response = await agent
    .post(`/organization/${organizationSlug}/bots/${botSlug}/upload-pdf-bot`)
    .attach('file', body, {
      filename: basename(pdfFilePath),
      contentType: 'application/pdf',
    })
    .expect(201);

  const documentId = response.body.documentId as string;
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
  });

  storage.track(document.storageKey);

  return {
    body,
    documentId,
    fileName: pdfFileName,
    storageKey: document.storageKey,
  };
}
