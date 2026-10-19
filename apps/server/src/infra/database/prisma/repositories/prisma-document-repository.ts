import { Injectable } from '@nestjs/common';
import { DomainEvents } from '../../../../core/events/domain-events.js';
import { DocumentRepository } from '../../../../domain/application/repositories/document-repository.js';
import type { Document } from '../../../../domain/enterprise/entities/document.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaDocumentMapper } from '../mappers/prisma-document-mapper.js';
import { PrismaDocumentDetailsMapper } from '../mappers/prisma-document-details-mapper.js';
import type { Prisma } from '../../../../../prisma/generated/prisma/client.js';

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

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
                    text: document.content.text,
                    content: toPrismaJson(document.content.content),
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
                      text: document.content.text,
                      content: toPrismaJson(document.content.content),
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

  async findManyByBotId(botId: string): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        botId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      include: {
        content: true,
      },
    });

    if (!document) {
      return null;
    }

    return PrismaDocumentMapper.toDomain(document);
  }

  async findDetailsByIdAndBotId(
    documentId: string,
    botId: string,
  ) {
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
          text: content.text,
          content: toPrismaJson(content.content),
          processedAt: content.processedAt,
          version: content.version,
        },
        update: {
          text: content.text,
          content: toPrismaJson(content.content),
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
