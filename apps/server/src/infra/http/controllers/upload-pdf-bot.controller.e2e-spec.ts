import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { Uploader } from '../../../domain/application/storage/uploader.js';
import { CreatePresignedBotPdfUploadUseCase } from '../../../domain/application/use-cases/create-presigned-bot-pdf-upload.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { PrismaDocumentRepository } from '../../database/prisma/repositories/prisma-document-repository.js';
import { EnvService } from '../../env/env.service.js';
import type { Env } from '../../env/env.js';
import { R2DocumentStorage } from '../../storage/r2-document-storage.js';
import { UploadPdfBotController } from './upload-pdf-bot.controller.js';

const pdfFileName = 'bot.pdf';
const pdfFilePath = resolve(process.cwd(), 'test/e2e/fixtures', pdfFileName);

describe('Upload PDF bot (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizationId: string;

  beforeAll(async () => {
    const envService = {
      get: <T extends keyof Env>(key: T) => process.env[key] as Env[T],
    } satisfies Pick<EnvService, 'get'>;

    const moduleRef = await Test.createTestingModule({
      controllers: [UploadPdfBotController],
      providers: [
        {
          provide: EnvService,
          useValue: envService,
        },
        PrismaService,
        CreatePresignedBotPdfUploadUseCase,
        PrismaDocumentRepository,
        R2DocumentStorage,
        {
          provide: DocumentRepository,
          useExisting: PrismaDocumentRepository,
        },
        {
          provide: Uploader,
          useExisting: R2DocumentStorage,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    organizationId = `e2e-${randomUUID()}`;

    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'E2E Upload Organization',
        slug: organizationId,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate a presigned URL and upload the PDF', async () => {
    const pdf = await readFile(pdfFilePath);

    const response = await request(app.getHttpServer())
      .post(`/organization/${organizationId}/upload-pdf-bot`)
      .send({
        filename: basename(pdfFilePath),
        contentType: 'application/pdf',
        size: pdf.length,
      })
      .expect(201);

    const presignedUpload = response.body.value;

    expect(presignedUpload).toMatchObject({
      documentId: expect.any(String),
      uploadUrl: expect.stringMatching(/^https:\/\//),
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      expiresAt: expect.any(String),
    });

    const uploadResponse = await fetch(presignedUpload.uploadUrl, {
      method: presignedUpload.method,
      headers: presignedUpload.headers,
      body: pdf,
    });

    expect(uploadResponse.ok).toBe(true);

    const document = await prisma.document.findUnique({
      where: {
        id: presignedUpload.documentId,
      },
    });

    expect(document).toEqual({
      id: presignedUpload.documentId,
      organizationId,
      name: pdfFileName,
      storageKey: `organizations/${organizationId}/documents/${presignedUpload.documentId}/original.pdf`,
      contentType: 'application/pdf',
      size: pdf.length,
      status: 'PENDING',
      createdAt: expect.any(Date),
    });
  });
});
