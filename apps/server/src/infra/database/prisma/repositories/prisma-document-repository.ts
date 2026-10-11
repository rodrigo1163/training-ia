import { Injectable } from '@nestjs/common';
import {
  CreateDocumentInput,
  DocumentData,
  DocumentDeletionData,
  DocumentRepository,
} from '../../../../domain/application/repositories/document-repository.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaDocumentMapper } from '../mappers/prisma-document-mapper.js';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: CreateDocumentInput): Promise<void> {
    const data = PrismaDocumentMapper.toPrisma(document);

    await this.prisma.document.create({
      data,
    });
  }

  async findManyByBotId(botId: string): Promise<DocumentData[]> {
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
  ): Promise<DocumentDeletionData | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        botId,
      },
    });

    return document ? PrismaDocumentMapper.toDeletionData(document) : null;
  }

  async findManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<DocumentDeletionData[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        id: { in: documentIds },
        botId,
      },
    });

    return documents.map(PrismaDocumentMapper.toDeletionData);
  }

  async deleteByIdAndBotId(documentId: string, botId: string): Promise<void> {
    await this.prisma.document.deleteMany({
      where: {
        id: documentId,
        botId,
      },
    });
  }

  async deleteManyByIdsAndBotId(
    documentIds: string[],
    botId: string,
  ): Promise<void> {
    await this.prisma.document.deleteMany({
      where: {
        id: { in: documentIds },
        botId,
      },
    });
  }
}
