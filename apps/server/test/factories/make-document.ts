import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Document, Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../../src/infra/database/prisma/prisma.service.js';

type MakeDocumentInput = Pick<Prisma.DocumentUncheckedCreateInput, 'botId'> &
  Partial<Omit<Prisma.DocumentUncheckedCreateInput, 'botId'>>;

@Injectable()
export class DocumentFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaDocument(data: MakeDocumentInput): Promise<Document> {
    const suffix = randomUUID();

    return this.prisma.document.create({
      data: {
        id: data.id ?? `document-${suffix}`,
        botId: data.botId,
        name: data.name ?? `document-${suffix}.pdf`,
        storageKey:
          data.storageKey ?? `test/documents/document-${suffix}/original.pdf`,
        contentType: data.contentType ?? 'application/pdf',
        size: data.size ?? 1024,
        status: data.status ?? 'PENDING',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }
}
