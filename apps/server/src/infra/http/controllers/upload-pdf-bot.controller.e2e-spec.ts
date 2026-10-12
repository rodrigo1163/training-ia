import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { afterAll, beforeAll } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { Uploader } from '../../../domain/application/storage/uploader.js';
import { UploadBotPdfUseCase } from '../../../domain/application/use-cases/upload-bot-pdf.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { PrismaDocumentRepository } from '../../database/prisma/repositories/prisma-document-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { PrismaOrganizationRepository } from '../../database/prisma/repositories/prisma-organization-repository.js';
import { EnvService } from '../../env/env.service.js';
import type { Env } from '../../env/env.js';
import { R2Storage } from '../storage/r2-storage.js';
import { UploadPdfBotController } from './upload-pdf-bot.controller.js';
import { BotRepository } from '../../../domain/application/repositories/bot-repository.js';
import { PrismaBotRepository } from '../../database/prisma/repositories/prisma-bot-repository.js';

const pdfFileName = 'bot.pdf';
const pdfFilePath = resolve(process.cwd(), 'test/e2e/fixtures', pdfFileName);

describe('Upload PDF bot (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizationId: string;
  let organizationSlug: string;
  let botId: string;
  let r2Client: S3Client;
  let storage: R2Storage;
  let uploadedStorageKey: string | null = null;

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
        UploadBotPdfUseCase,
        PrismaDocumentRepository,
        PrismaOrganizationRepository,
        PrismaBotRepository,
        R2Storage,
        {
          provide: BotRepository,
          useExisting: PrismaBotRepository,
        },
        {
          provide: DocumentRepository,
          useExisting: PrismaDocumentRepository,
        },
        {
          provide: Uploader,
          useExisting: R2Storage,
        },
        {
          provide: OrganizationRepository,
          useExisting: PrismaOrganizationRepository,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((request: Request, _response: Response, next: NextFunction) => {
      Reflect.set(request, 'session', {
        session: { activeOrganizationId: organizationId },
        user: { id: 'e2e-user' },
      });
      next();
    });
    await app.init();

    prisma = moduleRef.get(PrismaService);
    storage = moduleRef.get(R2Storage);
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${envService.get('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    const organizationSuffix = randomUUID();
    organizationId = `e2e-id-${organizationSuffix}`;
    organizationSlug = `e2e-slug-${organizationSuffix}`;
    botId = `e2e-bot-${organizationSuffix}`;

    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'E2E Upload Organization',
        slug: organizationSlug,
        createdAt: new Date(),
      },
    });
    await prisma.bot.create({
      data: {
        id: botId,
        organizationId,
        name: 'Upload Bot',
        slug: 'upload-bot',
      },
    });
  });

  afterAll(async () => {
    if (uploadedStorageKey) {
      await storage.deleteObject({ key: uploadedStorageKey });
    }

    r2Client.destroy();
    await app.close();
  });

  it('should upload the PDF through the backend', async () => {
    const pdf = await readFile(pdfFilePath);

    const response = await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
      .attach('file', pdf, {
        filename: basename(pdfFilePath),
        contentType: 'application/pdf',
      })
      .expect(201);

    const upload = response.body;

    expect(upload).toEqual({
      documentId: expect.any(String),
    });

    uploadedStorageKey = `organizations/${organizationId}/bots/${botId}/documents/${upload.documentId}/original.pdf`;
    const storedObject = await r2Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uploadedStorageKey,
      }),
    );
    const storedPdf = await storedObject.Body?.transformToByteArray();

    expect(Buffer.from(storedPdf ?? [])).toEqual(pdf);
    expect(storedObject.ContentType).toBe('application/pdf');

    const document = await prisma.document.findUnique({
      where: {
        id: upload.documentId,
      },
    });

    expect(document).toEqual({
      id: upload.documentId,
      botId,
      name: pdfFileName,
      storageKey: uploadedStorageKey,
      contentType: 'application/pdf',
      size: pdf.length,
      status: 'PENDING',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should reject a request without a file', async () => {
    await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
      .expect(400);
  });

  it('should reject a file whose content is not a PDF', async () => {
    await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'invalid.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
  });

  it('should reject a PDF without the .pdf extension', async () => {
    const pdf = await readFile(pdfFilePath);

    await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
      .attach('file', pdf, {
        filename: 'invalid.txt',
        contentType: 'application/pdf',
      })
      .expect(400);
  });

  it('should reject a file larger than 10 MB', async () => {
    await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'too-large.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
  });
});
