import { Injectable } from '@nestjs/common';
import { DocumentRepository } from '../../../../domain/application/repositories/document-repository.js';
import type { Document } from '../../../../domain/enterprise/entities/document.js';
import type { DocumentContent } from '../../../../domain/enterprise/entities/document-content.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaDocumentMapper } from '../mappers/prisma-document-mapper.js';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: Document, content?: DocumentContent): Promise<void> {
    const data = PrismaDocumentMapper.toPrisma(document);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.document.create({
        data: {
          ...data,
          ...(content
            ? {
                content: {
                  create: {
                    text: content.text,
                    processedAt: content.processedAt,
                    version: content.version,
                  },
                },
              }
            : {}),
        },
      });
    });
  }

  async findManyByBotId(botId: string): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        botId,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return documents.map(PrismaDocumentMapper.toDomain);
  }

  async findByIdAndBotId(
    documentId: string,
    botId: string,
  ): Promise<Document | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        botId,
      },
    });

    if (!document) {
      return null;
    }

    return PrismaDocumentMapper.toDomain(document);
  }

  async findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        id: { in: documentIds },
        botId,
      },
    });

    return documents.map(PrismaDocumentMapper.toDomain);
  }

  async delete(document: Document): Promise<void> {
    await this.prisma.document.deleteMany({
      where: {
        id: document.id.toString(),
        botId: document.botId.toString(),
      },
    });
  }

  async deleteMany(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    await this.prisma.document.deleteMany({
      where: {
        id: { in: documents.map((document) => document.id.toString()) },
        botId: documents[0].botId.toString(),
      },
    });
  }
}
