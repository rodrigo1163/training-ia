import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { afterAll, beforeAll } from 'vitest';
import { DocumentRepository } from '../../../domain/application/repositories/document-repository.js';
import { Uploader } from '../../../domain/application/storage/uploader.js';
import { CreatePresignedBotPdfUploadUseCase } from '../../../domain/application/use-cases/create-presigned-bot-pdf-upload.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { PrismaDocumentRepository } from '../../database/prisma/repositories/prisma-document-repository.js';
import { OrganizationRepository } from '../../../domain/application/repositories/organization-repository.js';
import { PrismaOrganizationRepository } from '../../database/prisma/repositories/prisma-organization-repository.js';
import { EnvService } from '../../env/env.service.js';
import type { Env } from '../../env/env.js';
import { R2DocumentStorage } from '../../storage/r2-document-storage.js';
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
        PrismaOrganizationRepository,
        PrismaBotRepository,
        R2DocumentStorage,
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
          useExisting: R2DocumentStorage,
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
    await app.close();
  });

  it('should generate a presigned URL and upload the PDF', async () => {
    const pdf = await readFile(pdfFilePath);

    const response = await request(app.getHttpServer())
      .post(`/organization/${organizationSlug}/bots/upload-bot/upload-pdf-bot`)
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
      botId,
      name: pdfFileName,
      storageKey: `organizations/${organizationId}/bots/${botId}/documents/${presignedUpload.documentId}/original.pdf`,
      contentType: 'application/pdf',
      size: pdf.length,
      status: 'PENDING',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
