import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@training-ia/core/events/domain-events.js';
import type {
  PaginationParams,
  PaginationResult,
} from '@training-ia/core/repositories/pagination-params.js';
import { Prisma } from '@training-ia/database/client';
import { DocumentRepository } from '../../../../domain/application/repositories/document-repository.js';
import type { Document } from '../../../../domain/enterprise/entities/document.js';
import type { DocumentDetails } from '../../../../domain/enterprise/value-objects/document-details.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaDocumentMapper } from '../mappers/prisma-document-mapper.js';
import { PrismaDocumentDetailsMapper } from '../mappers/prisma-document-details-mapper.js';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: Document): Promise<void> {
    const data = PrismaDocumentMapper.toPrisma(document);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.document.create({
        data: {
          ...data,
          ...(document.content
            ? {
                content: {
                  create: {
                    markdown: document.content.markdown,
                    processedAt: document.content.processedAt,
                    version: document.content.version,
                  },
                },
              }
            : {}),
        },
      });
    });

    await DomainEvents.dispatchEventsForAggregate(document.id);
  }

  async createMany(documents: Document[]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      for (const document of documents) {
        const data = PrismaDocumentMapper.toPrisma(document);

        await transaction.document.create({
          data: {
            ...data,
            ...(document.content
              ? {
                  content: {
                    create: {
                      markdown: document.content.markdown,
                      processedAt: document.content.processedAt,
                      version: document.content.version,
                    },
                  },
                }
              : {}),
          },
        });
      }
    });

    for (const document of documents) {
      await DomainEvents.dispatchEventsForAggregate(document.id);
    }
  }

  async findManyByBotId(
    botId: string,
    { page, pageSize }: PaginationParams,
    search?: string,
  ): Promise<PaginationResult<DocumentDetails>> {
    const where = this.buildListWhere(botId, search);
    const [documents, totalItems] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: documents.map((document) =>
        PrismaDocumentDetailsMapper.toDomain({
          ...document,
          content: null,
        }),
      ),
      totalItems,
    };
  }

  async getTotalSizeByBotId(botId: string): Promise<number> {
    const result = await this.prisma.document.aggregate({
      where: { botId },
      _sum: { size: true },
    });

    return result._sum.size ?? 0;
  }

  private buildListWhere(
    botId: string,
    search?: string,
  ): Prisma.DocumentWhereInput {
    const normalizedSearch = search?.trim().toLowerCase();

    if (!normalizedSearch) {
      return { botId };
    }

    const where: Prisma.DocumentWhereInput = {
      botId,
      OR: [
        { name: { contains: normalizedSearch, mode: 'insensitive' } },
        { contentType: { contains: normalizedSearch, mode: 'insensitive' } },
      ],
    };

    const statusByLabel = {
      pending: ['PENDING', 'PROCESSING'],
      processing: ['PENDING', 'PROCESSING'],
      active: ['READY'],
      ready: ['READY'],
      inactive: ['FAILED'],
      failed: ['FAILED'],
    } as const;
    const statusMatches =
      statusByLabel[normalizedSearch as keyof typeof statusByLabel];

    if (statusMatches) {
      where.OR?.push({ status: { in: [...statusMatches] } });
    }

    const contentTypeByLabel = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      website: 'text/html',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as const;
    const contentTypeMatch =
      contentTypeByLabel[normalizedSearch as keyof typeof contentTypeByLabel];

    if (contentTypeMatch) {
      where.OR?.push({ contentType: contentTypeMatch });
    }

    return where;
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
      include: {
        content: true,
      },
    });

    if (!document) {
      return null;
    }

    return PrismaDocumentMapper.toDomain(document);
  }

  async findDetailsByIdAndBotId(documentId: string, botId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        botId,
      },
      include: {
        content: true,
      },
    });

    if (!document) {
      return null;
    }

    return PrismaDocumentDetailsMapper.toDomain(document);
  }

  async update(document: Document): Promise<void> {
    const content = document.content;

    if (!content) {
      throw new Error('Document content is required to update the document.');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.document.update({
        where: {
          id: document.id.toString(),
        },
        data: {
          textHash: document.textHash,
          status: document.status,
          updatedAt: document.updatedAt,
        },
      });

      await transaction.documentContent.upsert({
        where: {
          documentId: document.id.toString(),
        },
        create: {
          documentId: document.id.toString(),
          markdown: content.markdown,
          processedAt: content.processedAt,
          version: content.version,
        },
        update: {
          markdown: content.markdown,
          processedAt: content.processedAt,
          version: content.version,
        },
      });
    });

    await DomainEvents.dispatchEventsForAggregate(document.id);
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
